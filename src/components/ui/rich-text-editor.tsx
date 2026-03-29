"use client";

import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import LinkExtension from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import {
	Bold,
	Code2,
	Heading1,
	Heading2,
	Italic,
	Link,
	List,
	ListOrdered,
} from "lucide-react";
import {
	forwardRef,
	useCallback,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { api } from "~/trpc/react";
import "tippy.js/dist/tippy.css";

const lowlight = createLowlight(common);

interface RichTextEditorProps {
	content: string;
	onChange?: (html: string) => void;
	onBlur?: () => void;
	readOnly?: boolean;
	placeholder?: string;
	className?: string;
	teamId?: string;
	minHeight?: number;
}

export interface RichTextEditorRef {
	getHTML: () => string;
	setContent: (content: string) => void;
	undo: () => void;
}

interface MentionSuggestionItem {
	id: string;
	label?: string;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
	(
		{
			content,
			onChange,
			onBlur,
			readOnly = false,
			placeholder = "Add a description...",
			className,
			teamId,
		},
		ref,
	) => {
		const lastSavedContentRef = useRef(content);
		lastSavedContentRef.current = content;
		const [selectedIndex, setSelectedIndex] = useState(0);
		const { data: teamMembers } = api.team.getMembers.useQuery(
			{ teamId: teamId ?? "" },
			{ enabled: !!teamId },
		);

		const suggestionsList =
			teamMembers?.map(
				(member: {
					user: {
						id: string;
						name: string | null;
						email: string;
						image: string | null;
					};
				}) => ({
					id: member.user.id,
					label: member.user.name ?? member.user.email,
					avatar: member.user.image,
				}),
			) ?? [];

		const editor = useEditor({
			extensions: [
				StarterKit.configure({
					codeBlock: false,
				}),
				LinkExtension.configure({
					openOnClick: false,
					HTMLAttributes: {
						class: "text-[#5E6AD2] underline cursor-pointer",
					},
				}),
				CodeBlockLowlight.configure({
					lowlight,
					HTMLAttributes: {
						class:
							"rounded-md bg-[#1a1c21] p-4 font-mono text-sm text-[#F7F8F8] my-2",
					},
				}),
				Mention.configure({
					HTMLAttributes: {
						class:
							"bg-[#5E6AD2]/20 text-[#5E6AD2] px-1.5 py-0.5 rounded font-medium",
					},
					suggestion: {
						items: ({ query }: { query: string }) => {
							return suggestionsList
								.filter(
									(item: MentionSuggestionItem) =>
										item.label?.toLowerCase().includes(query.toLowerCase()) ??
										false,
								)
								.slice(0, 5);
						},
						render: () => {
							let popup: TippyInstance | null = null;
							let component: HTMLElement | null = null;

							return {
								onStart: (props) => {
									setSelectedIndex(0);
									component = document.createElement("div");
									component.className =
										"bg-[#16181D] border border-[#2A2F35] rounded-md shadow-lg p-1";

									props.items.forEach(
										(item: MentionSuggestionItem, index: number) => {
											const itemEl = document.createElement("div");
											itemEl.className = `px-3 py-2 cursor-pointer rounded flex items-center gap-2 text-[#F7F8F8] hover:bg-[#2A2F35] ${index === 0 ? "bg-[#2A2F35]" : ""}`;
											itemEl.textContent = item.label ?? "";
											itemEl.onclick = () => {
												props.command({ id: item.id, label: item.label });
											};
											component?.appendChild(itemEl);
										},
									);

									const tippyInstances = tippy(document.body, {
										getReferenceClientRect: props.clientRect as () => DOMRect,
										appendTo: () => document.body,
										content: component,
										showOnCreate: true,
										interactive: true,
										trigger: "manual",
										placement: "bottom-start",
									});
									popup = Array.isArray(tippyInstances)
										? tippyInstances[0]
										: tippyInstances;
								},
								onUpdate: (props) => {
									if (!component) return;
									component.innerHTML = "";

									props.items.forEach(
										(item: MentionSuggestionItem, index: number) => {
											const itemEl = document.createElement("div");
											itemEl.className = `px-3 py-2 cursor-pointer rounded flex items-center gap-2 text-[#F7F8F8] hover:bg-[#2A2F35] ${index === selectedIndex ? "bg-[#2A2F35]" : ""}`;
											itemEl.textContent = item.label ?? "";
											itemEl.onclick = () => {
												props.command({ id: item.id, label: item.label });
											};
											component?.appendChild(itemEl);
										},
									);

									popup?.setProps({
										getReferenceClientRect: props.clientRect as () => DOMRect,
									});
								},
								onKeyDown: (props) => {
									// biome-ignore lint/suspicious/noExplicitAny: TipTap suggestion types are complex
									const event = (props as any).event as KeyboardEvent;
									// biome-ignore lint/suspicious/noExplicitAny: TipTap suggestion types are complex
									const items = (props as any).items as MentionSuggestionItem[];
									if (event.key === "Escape") {
										popup?.hide();
										return true;
									}
									if (event.key === "ArrowDown") {
										setSelectedIndex((prev) =>
											Math.min(prev + 1, items.length - 1),
										);
										return true;
									}
									if (event.key === "ArrowUp") {
										setSelectedIndex((prev) => Math.max(prev - 1, 0));
										return true;
									}
									return false;
								},
								onExit: () => {
									popup?.destroy();
								},
							};
						},
					},
				}),
			],
			content,
			editable: !readOnly,
			onUpdate: ({ editor }) => {
				const html = editor.getHTML();
				onChange?.(html);
			},
			onBlur: () => {
				onBlur?.();
			},
			editorProps: {
				attributes: {
					class: cn(
						"prose prose-invert min-h-[200px] max-w-none focus:outline-none",
						"prose-p:my-1 prose-p:text-[#F7F8F8]",
						"prose-h1:mb-2 prose-h1:font-bold prose-h1:text-2xl prose-h1:text-[#F7F8F8]",
						"prose-h2:mb-2 prose-h2:font-semibold prose-h2:text-[#F7F8F8] prose-h2:text-xl",
						"prose-ul:my-2 prose-ul:ml-4 prose-ul:list-disc",
						"prose-ol:my-2 prose-ol:ml-4 prose-ol:list-decimal",
						"prose-li:my-0.5 prose-li:text-[#F7F8F8]",
						"prose-code:rounded prose-code:bg-[#1a1c21] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[#F7F8F8] prose-code:text-sm",
						"prose-pre:my-2 prose-pre:rounded-md prose-pre:bg-[#1a1c21] prose-pre:p-4",
						"prose-a:cursor-pointer prose-a:text-[#5E6AD2] prose-a:underline",
						"prose-blockquote:border-[#5E6AD2] prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:text-[#8A8F98] prose-blockquote:italic",
						"empty:before:pointer-events-none empty:before:text-[#8A8F98] empty:before:italic empty:before:content-[attr(data-placeholder)]",
						className,
					),
					"data-placeholder": placeholder,
				},
				handleKeyDown: (_view, event) => {
					if ((event.metaKey || event.ctrlKey) && event.key === "s") {
						event.preventDefault();
						onBlur?.();
						return true;
					}
					return false;
				},
			},
		});

		useImperativeHandle(
			ref,
			() => ({
				getHTML: () => editor?.getHTML() ?? "",
				setContent: (newContent: string) => {
					if (editor && newContent !== editor.getHTML()) {
						editor.commands.setContent(newContent);
					}
				},
				undo: () => {
					if (lastSavedContentRef.current) {
						editor?.commands.setContent(lastSavedContentRef.current);
					}
				},
			}),
			[editor],
		);

		const setLink = useCallback(() => {
			if (!editor) return;

			const previousUrl = editor.getAttributes("link").href as string;
			const url = window.prompt("Enter URL", previousUrl);

			if (url === null) return;

			if (url === "") {
				editor.chain().focus().extendMarkRange("link").unsetLink().run();
				return;
			}

			editor
				.chain()
				.focus()
				.extendMarkRange("link")
				.setLink({ href: url })
				.run();
		}, [editor]);

		return (
			<div
				className={cn(
					"overflow-hidden rounded-md border border-[#2A2F35] bg-[#16181D]",
					className,
				)}
			>
				<div className="flex items-center gap-0.5 border-[#2A2F35] border-b bg-[#0F1115] px-2 py-1.5">
					<ToggleButton
						isActive={editor.isActive("bold")}
						onClick={() => editor.chain().focus().toggleBold().run()}
						tooltip="Bold (Cmd+B)"
					>
						<Bold className="h-4 w-4" />
					</ToggleButton>

					<ToggleButton
						isActive={editor.isActive("italic")}
						onClick={() => editor.chain().focus().toggleItalic().run()}
						tooltip="Italic (Cmd+I)"
					>
						<Italic className="h-4 w-4" />
					</ToggleButton>

					<div className="mx-1 h-4 w-px bg-[#2A2F35]" />

					<ToggleButton
						isActive={editor.isActive("heading", { level: 1 })}
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 1 }).run()
						}
						tooltip="Heading 1"
					>
						<Heading1 className="h-4 w-4" />
					</ToggleButton>

					<ToggleButton
						isActive={editor.isActive("heading", { level: 2 })}
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 2 }).run()
						}
						tooltip="Heading 2"
					>
						<Heading2 className="h-4 w-4" />
					</ToggleButton>

					<div className="mx-1 h-4 w-px bg-[#2A2F35]" />

					<ToggleButton
						isActive={editor.isActive("bulletList")}
						onClick={() => editor.chain().focus().toggleBulletList().run()}
						tooltip="Bullet List"
					>
						<List className="h-4 w-4" />
					</ToggleButton>

					<ToggleButton
						isActive={editor.isActive("orderedList")}
						onClick={() => editor.chain().focus().toggleOrderedList().run()}
						tooltip="Numbered List"
					>
						<ListOrdered className="h-4 w-4" />
					</ToggleButton>

					<div className="mx-1 h-4 w-px bg-[#2A2F35]" />

					<ToggleButton
						isActive={editor.isActive("code")}
						onClick={() => editor.chain().focus().toggleCode().run()}
						tooltip="Inline Code"
					>
						<span className="font-mono text-xs">{"</>"}</span>
					</ToggleButton>

					<ToggleButton
						isActive={editor.isActive("codeBlock")}
						onClick={() => editor.chain().focus().toggleCodeBlock().run()}
						tooltip="Code Block"
					>
						<Code2 className="h-4 w-4" />
					</ToggleButton>

					<div className="mx-1 h-4 w-px bg-[#2A2F35]" />

					<ToggleButton
						isActive={editor.isActive("link")}
						onClick={setLink}
						tooltip="Add Link"
					>
						<Link className="h-4 w-4" />
					</ToggleButton>

					{teamId && (
						<ToggleButton
							isActive={false}
							onClick={() => editor.chain().focus().insertContent("@").run()}
							tooltip="Mention (@)"
						>
							<span className="text-sm">@</span>
						</ToggleButton>
					)}
				</div>

				<div className="p-3">
					<EditorContent className="min-h-[200px]" editor={editor} />
				</div>
			</div>
		);
	},
);

RichTextEditor.displayName = "RichTextEditor";

interface ToggleButtonProps {
	onClick: () => void;
	isActive: boolean;
	children: React.ReactNode;
	tooltip?: string;
}

function ToggleButton({
	onClick,
	isActive,
	children,
	tooltip,
}: ToggleButtonProps) {
	const button = (
		<Button
			className={cn(
				"h-8 w-8 p-0",
				isActive
					? "bg-[#5E6AD2] text-white hover:bg-[#4F57B3]"
					: "text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]",
			)}
			onClick={onClick}
			size="sm"
			type="button"
			variant="ghost"
		>
			{children}
		</Button>
	);

	if (tooltip) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>{button}</TooltipTrigger>
					<TooltipContent>
						<p>{tooltip}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return button;
}

export default RichTextEditor;
