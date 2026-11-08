import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/ui/button";
import { ErrorState } from "@/ui/empty-state";

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
