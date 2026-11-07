import { Pencil } from "lucide-react";
import { Field } from "@/ui/field";
import { Switch } from "@/ui/switch";
import { Button } from "@/ui/button";
import { controlClass } from "@/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/dialog";
import { HobbySelector } from "@/components/HobbySelector";
import { parseHobbies } from "@/constants/hobbies";
import {
  CLEANLINESS_LEVELS,
  PERSONALITY_OPTIONS,
  SLEEP_OPTIONS,
  type ProfileFormState,
} from "./profileTypes";

interface ProfileHabitsCardProps {
  lookingForRoommate: boolean;
  sleepSchedule: string;
  personality: string;
  cleanliness: string;
  smoking: boolean;
  interests: string;
  onChange: <
    K extends
      | "looking_for_roommate"
      | "sleep_schedule"
      | "personality"
      | "cleanliness"
      | "smoking"
      | "interests",
  >(
    key: K,
    value: ProfileFormState[K],
  ) => void;
  errors: { interests?: string | undefined };
}

const SELECT_CLASS = `${controlClass()} h-11 px-3 text-sm`;
const MAX_SUMMARY_CHIPS = 6;

/*
  Roommate-matching preferences, kept light: one switch to opt in, two
  dropdowns, a slider and a switch. Hobbies show as a short summary; the full
  picker opens in a dialog on request. When matching is off the details hide.
*/
export function ProfileHabitsCard({
  lookingForRoommate,
  sleepSchedule,
  personality,
  cleanliness,
  smoking,
  interests,
  onChange,
  errors,
}: ProfileHabitsCardProps) {
  const hobbies = parseHobbies(interests);
  const level = CLEANLINESS_LEVELS.find((l) => String(l.level) === cleanliness);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">Tìm bạn ở cùng phòng</p>
          <p className="text-sm text-muted">
            Hiển thị hồ sơ của bạn cho trợ lý ghép bạn cùng phòng AI
          </p>
        </div>
        <Switch
          checked={lookingForRoommate}
          onChange={(next) => {
            onChange("looking_for_roommate", next);
          }}
          label="Tìm bạn ở cùng phòng"
        />
      </div>

      {lookingForRoommate ? (
        <div className="space-y-5 border-t border-line pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="p-sleep" label="Giờ giấc ngủ">
              <select
                id="p-sleep"
                value={sleepSchedule}
                onChange={(e) => {
                  onChange("sleep_schedule", e.target.value);
                }}
                className={SELECT_CLASS}
              >
                <option value="">Chưa chọn</option>
                {SLEEP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} ({o.sub})
                  </option>
                ))}
              </select>
            </Field>
            <Field id="p-personality" label="Tính cách">
              <select
                id="p-personality"
                value={personality}
                onChange={(e) => {
                  onChange("personality", e.target.value);
                }}
                className={SELECT_CLASS}
              >
                <option value="">Chưa chọn</option>
                {PERSONALITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} ({o.sub})
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="p-clean" className="text-sm font-medium text-ink">
                Độ sạch sẽ
              </label>
              <span className="text-sm text-muted">{level ? level.label : "Chưa chọn"}</span>
            </div>
            <input
              id="p-clean"
              type="range"
              min={1}
              max={5}
              step={1}
              value={cleanliness || "3"}
              aria-valuetext={level ? level.label : "Chưa chọn"}
              onChange={(e) => {
                onChange("cleanliness", e.target.value);
              }}
              className="mt-2 h-8 w-full cursor-pointer accent-plate"
            />
            <div className="flex justify-between text-xs text-muted" aria-hidden>
              <span>Thoải mái</span>
              <span>Rất kỹ tính</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink">Hút thuốc</p>
              <p className="text-sm text-muted">Bạn có hút thuốc trong phòng không?</p>
            </div>
            <Switch
              checked={smoking}
              onChange={(next) => {
                onChange("smoking", next);
              }}
              label="Hút thuốc"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink">
                Sở thích <span className="font-normal text-muted">· {hobbies.length}</span>
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="gap-1.5">
                    <Pencil className="size-3.5" aria-hidden />
                    Sửa sở thích
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85dvh] max-w-xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Sở thích của bạn</DialogTitle>
                    <DialogDescription>
                      Sở thích chung giúp AI gợi ý bạn cùng phòng hợp với bạn hơn.
                    </DialogDescription>
                  </DialogHeader>
                  <HobbySelector
                    value={interests}
                    onChange={(val) => {
                      onChange("interests", val);
                    }}
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="primary">
                        Xong
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {hobbies.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {hobbies.slice(0, MAX_SUMMARY_CHIPS).map((h) => (
                  <li
                    key={h.key}
                    className="rounded-full border border-line bg-tint/50 px-3 py-1 text-sm text-ink-2"
                  >
                    {h.label}
                  </li>
                ))}
                {hobbies.length > MAX_SUMMARY_CHIPS ? (
                  <li className="px-1 py-1 text-sm text-muted">
                    +{hobbies.length - MAX_SUMMARY_CHIPS}
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">Chưa chọn sở thích nào.</p>
            )}
            {errors.interests ? (
              <p role="alert" className="mt-1.5 text-sm text-danger">
                {errors.interests}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
