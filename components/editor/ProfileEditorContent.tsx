import { BasicsTab } from "./tabs/BasicsTab";
import { ExperienceTab } from "./tabs/ExperienceTab";
import { EducationTab } from "./tabs/EducationTab";
import { SkillsTab } from "./tabs/SkillsTab";
import { ProjectsTab } from "./tabs/ProjectsTab";
import { AdditionalTab } from "./tabs/AdditionalTab";

interface ProfileEditorContentProps {
    readonly showParser?: boolean;
    readonly parserComponent?: React.ReactNode;
}

export function ProfileEditorContent({ showParser, parserComponent }: ProfileEditorContentProps) {
    return (
        <>
            <BasicsTab showParser={showParser} parserComponent={parserComponent} />
            <ExperienceTab />
            <EducationTab />
            <SkillsTab />
            <ProjectsTab />
            <AdditionalTab />
        </>
    );
}
