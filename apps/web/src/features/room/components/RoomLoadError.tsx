import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/shared/ui/button";
import { ErrorState } from "@/shared/ui/empty-state";

export function RoomLoadError({ message }: { message: string }) {
  return (
    <ErrorState
      message={message}
      action={
        <Button asChild variant="outline">
          <Link to={ROUTES.ROOMS}>Về danh sách phòng</Link>
        </Button>
      }
      className="min-h-[60vh]"
    />
  );
}
