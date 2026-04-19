import { useState } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Calendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today.toISOString().split("T")[0];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-['Syne'] text-xl font-extrabold text-[#0d4a2c]">Calendar</h1>
        <p className="text-sm text-[#6b8878] mt-1">Session and appointment overview</p>
      </div>

      <div className="bg-white rounded-xl border border-[#cfe0d8] p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="px-3 py-1 border border-[#cfe0d8] rounded-lg hover:border-[#1a7a4a] transition-colors">←</button>
          <h3 className="font-['Syne'] text-base font-extrabold text-[#0d4a2c]">{MONTHS[month]} {year}</h3>
          <button onClick={nextMonth} className="px-3 py-1 border border-[#cfe0d8] rounded-lg hover:border-[#1a7a4a] transition-colors">→</button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold text-[#6b8878] uppercase py-2">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="h-20" />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            return (
              <div key={day} onClick={() => setSelectedDate(dateStr)}
                className={`h-20 border rounded-lg p-2 cursor-pointer transition-all ${isToday ? "border-[#1a7a4a] bg-[#d4ede1]" : "border-[#cfe0d8] hover:bg-[#f0f7f4]"} ${isSelected ? "ring-2 ring-[#1a7a4a]" : ""}`}>
                <div className={`text-sm font-bold ${isToday ? "text-[#1a7a4a]" : "text-[#1a2e24]"}`}>{day}</div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="bg-white rounded-xl border border-[#cfe0d8] p-5">
          <h3 className="font-semibold text-[#0d4a2c] mb-3">Sessions on {selectedDate}</h3>
          <p className="text-sm text-[#6b8878]">No sessions scheduled for this date.</p>
        </div>
      )}
    </div>
  );
}
