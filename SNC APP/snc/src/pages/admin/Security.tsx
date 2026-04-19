import { useState } from "react";

export default function Security() {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loginId, setLoginId] = useState("admin");

  const handlePasswordChange = () => {
    if (!currentPwd || !newPwd || !confirmPwd) { alert("All fields required"); return; }
    if (newPwd !== confirmPwd) { alert("Passwords don't match"); return; }
    if (newPwd.length < 8) { alert("Password must be at least 8 characters"); return; }
    alert("Password updated successfully!");
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
  };

  const handleLoginIdChange = () => {
    if (loginId.length < 5) { alert("Login ID must be at least 5 characters"); return; }
    alert("Login ID updated!");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-['Syne'] text-xl font-extrabold text-[#0d4a2c]">Security Settings</h1>
        <p className="text-sm text-[#6b8878] mt-1">Manage passwords and login credentials</p>
      </div>

      <div className="bg-white rounded-xl border border-[#cfe0d8] p-5 space-y-4">
        <h3 className="font-semibold text-[#0d4a2c]">Change Password</h3>
        <div>
          <label className="block text-sm font-semibold mb-1.5">Current Password</label>
          <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
            className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">New Password</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Confirm New Password</label>
            <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" />
          </div>
        </div>
        <button onClick={handlePasswordChange} className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg">Update Password</button>
      </div>

      <div className="bg-white rounded-xl border border-[#cfe0d8] p-5 space-y-4">
        <h3 className="font-semibold text-[#0d4a2c]">Change Login ID</h3>
        <div>
          <label className="block text-sm font-semibold mb-1.5">Current Login ID</label>
          <input value={loginId} disabled className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm bg-[#f3f4f6]" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5">New Login ID</label>
          <input type="text" value={loginId} onChange={e => setLoginId(e.target.value)}
            className="w-full px-4 py-2.5 border border-[#cfe0d8] rounded-lg text-sm focus:outline-none focus:border-[#1a7a4a]" />
        </div>
        <button onClick={handleLoginIdChange} className="px-4 py-2 bg-[#1a7a4a] text-white font-semibold rounded-lg">Update Login ID</button>
      </div>
    </div>
  );
}
