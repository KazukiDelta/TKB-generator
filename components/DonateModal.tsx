"use client";

import React from "react";
import { X, Heart, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DonateModal({ isOpen, onClose }: DonateModalProps) {
  if (!isOpen) return null;

  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = "/qrs.png";
    link.download = "creator_donate_qr.png";
    link.click();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-2xl bg-[#fffef0] dark:bg-[#181a20] border-[3px] border-[#2d2d2d] dark:border-[#383d4a] rounded-3xl shadow-[8px_8px_0px_0px_#2d2d2d] dark:shadow-[8px_8px_0px_0px_#090a0c] p-6 sm:p-8 space-y-6 text-[#2d2d2d] dark:text-[#f1f5f9] my-auto"
        >
          {/* Tape decoration */}
          <div className="hand-tape -top-3 left-1/2 -translate-x-1/2 !w-40 z-10" />

          {/* Header */}
          <div className="flex items-center justify-between border-b-[2.5px] border-dashed border-[#2d2d2d]/25 dark:border-white/15 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#ff4d4d] text-white border-2 border-[#2d2d2d] shadow-[3px_3px_0px_0px_#2d2d2d]">
                <Heart className="w-7 h-7 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl sm:text-3xl font-black font-kalam leading-tight text-[#2d2d2d] dark:text-[#fde047]">
                    Ủng Hộ Creator
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ff4d4d] text-white text-xs font-bold font-patrick border-[1.5px] border-[#2d2d2d] shadow-sm rotate-2">
                    Donate
                  </span>
                </div>
                <p className="text-sm sm:text-base font-patrick font-bold text-[#2d2d2d]/75 dark:text-[#cbd5e1] mt-0.5">
                  Mời tác giả ly trà sữa / cà phê để tiếp thêm động lực 🧋
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white dark:bg-[#27272a] border-2 border-[#2d2d2d] dark:border-white/30 text-[#2d2d2d] dark:text-white hover:bg-[#ff4d4d] hover:text-white transition-all shadow-[2px_2px_0px_0px_#2d2d2d]"
              title="Đóng"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-5 text-center flex flex-col items-center">
            {/* TRULY LARGE, PROMINENT QR CODE FRAME */}
            <div className="relative mx-auto w-full max-w-[500px] sm:max-w-[520px] rounded-3xl bg-white p-4 sm:p-6 border-[3px] border-[#2d2d2d] shadow-[6px_6px_0px_0px_#2d2d2d] dark:shadow-[6px_6px_0px_0px_#090a0c]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/qrs.png"
                alt="Donate QR Code"
                className="w-full h-auto object-contain rounded-2xl block mx-auto"
              />
            </div>

            {/* Instruction & Note */}
            <div className="space-y-1.5 px-2 max-w-xl">
              <p className="text-lg sm:text-xl font-bold font-patrick text-[#2d2d2d] dark:text-[#fde047] leading-snug">
                Quét mã QR bằng ứng dụng Ngân hàng hoặc Ví điện tử bất kỳ (Momo, ZaloPay, ViettelMoney...)
              </p>
              <div className="space-y-1 text-sm sm:text-base font-patrick text-[#2d2d2d]/80 dark:text-[#cbd5e1] leading-relaxed">
                <p>
                  Mình xin gửi một lời cảm ơn tới những ai Donate ủng hộ mình cũng như những người tin tưởng sử dụng website này của mình, mình sẽ cố cập nhật và duy trì website này cho mọi người
                </p>
                <p className="font-bold text-[#ff4d4d] dark:text-[#f43f5e] text-base sm:text-lg italic pt-1">
                  - From Delta with love -
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-1">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="w-full sm:flex-1 hand-btn font-kalam font-bold text-lg py-3 bg-white dark:bg-[#27272a] text-[#2d2d2d] dark:text-white border-2 border-[#2d2d2d] dark:border-white/30 hover:bg-[#fff9c4]"
              >
                <Download className="w-5 h-5" />
                <span>Tải Ảnh QR Về Máy</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 hand-btn font-kalam font-bold text-lg py-3 text-white bg-[#ff4d4d] border-2 border-[#2d2d2d] hover:bg-[#e03b3b]"
              >
                Đã Xong
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
