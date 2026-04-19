import { IconLock } from "@tabler/icons-react";

interface NoAccessProps {
  message?: string;
  detail?: string;
}

export default function NoAccess({
  message = "Access Restricted",
  detail,
}: NoAccessProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-[#fee2e2] rounded-full flex items-center justify-center mb-4">
        <IconLock className="w-8 h-8 text-[#dc2626]" />
      </div>
      <h3 className="font-['Syne'] text-lg font-extrabold text-[#0d4a2c] mb-2">
        {message}
      </h3>
      {detail && (
        <p className="text-sm text-[#6b8878] max-w-xs">{detail}</p>
      )}
    </div>
  );
}
