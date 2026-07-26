import { BackButton } from "@/components/chat/BackButton";
import { GroupCreateForm } from "@/components/groups/GroupCreateForm";

export default function NewGroupPage() {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3.5">
        <BackButton />
        <span className="font-display text-lg font-semibold text-text">Yangi guruh</span>
      </div>
      <div className="flex flex-1 justify-center">
        <GroupCreateForm />
      </div>
    </div>
  );
}
