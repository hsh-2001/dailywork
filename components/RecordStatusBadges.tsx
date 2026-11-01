import type { BookingStatus, SubmitStatus } from "@/shares/dtos/record/recordResponse";

const bookingStatusBadge: Record<BookingStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending booking", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  BOOKED: { label: "Booked", className: "bg-blue-50 text-blue-700 ring-blue-200" },
  CANCELLED: { label: "Booking cancelled", className: "bg-rose-50 text-rose-700 ring-rose-200" },
};

const submitStatusBadge: Record<SubmitStatus, { label: string; className: string }> = {
  NOT_SUBMITTED: { label: "Not submitted", className: "bg-slate-100 text-slate-600 ring-slate-200" },
  SUBMITTED: { label: "Submitted", className: "bg-sky-50 text-sky-700 ring-sky-200" },
  APPROVED: { label: "Approved", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  REJECTED: { label: "Rejected", className: "bg-red-50 text-red-700 ring-red-200" },
};

export default function RecordStatusBadges({
  bookingStatus,
  submitStatus,
}: {
  bookingStatus: BookingStatus;
  submitStatus: SubmitStatus;
}) {
  const badges = [
    bookingStatusBadge[bookingStatus],
    submitStatusBadge[submitStatus],
  ];

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {badges.map(({ label, className }) => (
        <span
          key={label}
          className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium leading-3 ring-1 ring-inset ${className}`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
