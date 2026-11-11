import { useSchools } from "@/features/listings/hooks/useReferenceData";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { PageHeader } from "@/shared/ui/page-header";
import { SuggestionForm } from "../components/SuggestionForm";
import { SuggestionResults } from "../components/SuggestionResults";
import { useAreaSuggestions } from "../hooks/useAreaSuggestions";

/** Students describe a school, budget and priorities; the AI suggests up to three areas. */
export default function AiAreaSuggestions() {
  useDocumentTitle("Gợi ý khu vực · TROSV");
  const { data: schools } = useSchools();
  const suggestions = useAreaSuggestions();

  return (
    <>
      <PageHeader
        title="Khu vực"
        highlight="phù hợp"
        description="Trợ lý AI gợi ý tối đa ba khu vực dựa trên ngân sách, trường học và thứ tự ưu tiên của bạn."
        className="max-w-4xl px-5 sm:px-5 lg:px-5"
      />

      <div className="mx-auto max-w-4xl p-5 pb-16">
        <SuggestionForm s={suggestions} schools={schools} />
        <SuggestionResults s={suggestions} />
      </div>
    </>
  );
}
