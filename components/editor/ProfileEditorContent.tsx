import { EditorContent } from "./EditorContent";

interface ProfileEditorContentProps {
    readonly showParser?: boolean;
    readonly parserComponent?: React.ReactNode;
}

export function ProfileEditorContent({ showParser: _showParser, parserComponent: _parserComponent }: ProfileEditorContentProps) {
    return (
        <EditorContent />
    );
}
