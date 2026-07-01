"use client";

import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isDanger?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  isDanger = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop />
      <ModalContainer placement="center" scroll="inside">
        <ModalDialog className="max-w-md mx-4 max-h-[calc(100dvh-2rem)] overflow-hidden flex flex-col">
          <ModalHeader className="flex gap-2 items-center pt-6 px-6">
            {isDanger && (
              <div className="p-2 bg-red-100 text-red-600 rounded-xl dark:bg-red-950/30 dark:text-red-400 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            <span className="text-lg font-bold text-slate-900 dark:text-slate-50 truncate">
              {title}
            </span>
          </ModalHeader>
          <ModalBody className="px-6 py-2 flex-1 min-h-0 overflow-y-auto">
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {message}
            </p>
          </ModalBody>
          <ModalFooter className="px-6 pb-6 pt-4 gap-3 shrink-0">
            <Button
              variant="ghost"
              onPress={onClose}
              isPending={isLoading}
              className="font-medium border-none shadow-none"
            >
              {cancelText}
            </Button>
            <Button
              variant={isDanger ? "danger" : "primary"}
              onPress={onConfirm}
              isPending={isLoading}
              className="font-semibold px-5"
            >
              {confirmText}
            </Button>
          </ModalFooter>
        </ModalDialog>
      </ModalContainer>
    </Modal>
  );
}
