import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowRight,
  HandCoins,
  LoaderCircle,
  X
} from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import type {
  GroupMember,
  GroupRole
} from "../../../types/group";
import {
  useAuth
} from "../../auth/context/AuthContext";
import {
  createSettlement
} from "../api/createSettlement";
import {
  createSettlementSchema,
  type CreateSettlementFormValues
} from "../schemas/createSettlementSchema";


interface SettleUpModalProps {
  groupId: string;
  currency: string;
  members: GroupMember[];
  currentUserRole: GroupRole;
  isOpen: boolean;
  onClose: () => void;
}


interface ApiErrorResponse {
  detail?: string;
}


function getCurrentDate(): string {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function SettleUpModal({
  groupId,
  currency,
  members,
  currentUserRole,
  isOpen,
  onClose
}: SettleUpModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin =
    currentUserRole === "admin";

  const defaultSenderId =
    user?.id ?? members[0]?.user_id ?? "";

  const defaultReceiverId =
    members.find(
      (member) =>
        member.user_id !== defaultSenderId
    )?.user_id ?? "";

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<CreateSettlementFormValues>({
    resolver: zodResolver(
      createSettlementSchema
    ),

    defaultValues: {
      from_user_id: defaultSenderId,
      to_user_id: defaultReceiverId,
      amount: 0,
      note: "",
      settlement_date: getCurrentDate()
    }
  });

  const selectedSenderId =
    watch("from_user_id");

  const selectedReceiverId =
    watch("to_user_id");

  const selectedSender = members.find(
    (member) =>
      member.user_id === selectedSenderId
  );

  const selectedReceiver = members.find(
    (member) =>
      member.user_id === selectedReceiverId
  );

  const createSettlementMutation =
    useMutation({
      mutationFn: createSettlement,

     onSuccess: async () => {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: [
        "groups",
        groupId,
        "balances"
      ]
    }),

    queryClient.invalidateQueries({
      queryKey: [
        "groups",
        groupId,
        "settlements"
      ]
    }),

    queryClient.invalidateQueries({
      queryKey: [
        "groups",
        groupId,
        "debt-suggestions"
      ]
    })
  ]);

  reset();
  onClose();
}
    });

  const isSaving =
    isSubmitting ||
    createSettlementMutation.isPending;


  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const senderId =
      user?.id ??
      members[0]?.user_id ??
      "";

    const receiverId =
      members.find(
        (member) =>
          member.user_id !== senderId
      )?.user_id ?? "";

    reset({
      from_user_id: senderId,
      to_user_id: receiverId,
      amount: 0,
      note: "",
      settlement_date: getCurrentDate()
    });

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape" &&
        !createSettlementMutation.isPending
      ) {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow = "";

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    isOpen,
    user?.id,
    members,
    reset,
    onClose,
    createSettlementMutation.isPending
  ]);


  useEffect(() => {
    if (
      selectedSenderId &&
      selectedSenderId === selectedReceiverId
    ) {
      const nextReceiver = members.find(
        (member) =>
          member.user_id !==
          selectedSenderId
      );

      setValue(
        "to_user_id",
        nextReceiver?.user_id ?? "",
        {
          shouldValidate: true
        }
      );
    }
  }, [
    selectedSenderId,
    selectedReceiverId,
    members,
    setValue
  ]);


async function onSubmit(
  data: CreateSettlementFormValues
) {
  // Create one unique ticket number for this
  // settlement request.
  const idempotencyKey =
    crypto.randomUUID();

  try {
    await createSettlementMutation.mutateAsync({
      groupId,
      idempotencyKey,

      payload: {
        ...data,
        amount: Number(data.amount),
        note: data.note.trim()
      }
    });
  } catch {
    // React Query stores the API error.
  }
} 


  function handleClose() {
    if (isSaving) {
      return;
    }

    createSettlementMutation.reset();
    onClose();
  }


  if (!isOpen) {
    return null;
  }


  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="settle-up-title"
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <HandCoins size={22} />
            </span>

            <div>
              <h2
                id="settle-up-title"
                className="text-xl font-bold text-slate-950"
              >
                Settle up
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Record a payment between members.
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close settle up modal"
            disabled={isSaving}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
            onClick={handleClose}
          >
            <X size={21} />
          </button>
        </div>

        <form
          className="space-y-5 p-6"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          {createSettlementMutation.isError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {axios.isAxiosError<ApiErrorResponse>(
                createSettlementMutation.error
              )
                ? createSettlementMutation.error
                    .response?.data.detail ??
                  "Unable to record the payment."
                : "Unable to record the payment."}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Paid by
            </label>

            {isAdmin ? (
              <select
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                {...register("from_user_id")}
              >
                {members.map((member) => (
                  <option
                    key={member.user_id}
                    value={member.user_id}
                  >
                    {member.name}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  type="hidden"
                  {...register("from_user_id")}
                />

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700">
                  {selectedSender?.name ??
                    user?.name ??
                    "Current user"}
                </div>
              </>
            )}

            {errors.from_user_id && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.from_user_id.message}
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <ArrowRight size={20} />
            </span>
          </div>

          <div>
            <label
              htmlFor="settlement-receiver"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Paid to
            </label>

            <select
              id="settlement-receiver"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              {...register("to_user_id")}
            >
              {members
                .filter(
                  (member) =>
                    member.user_id !==
                    selectedSenderId
                )
                .map((member) => (
                  <option
                    key={member.user_id}
                    value={member.user_id}
                  >
                    {member.name}
                  </option>
                ))}
            </select>

            {errors.to_user_id && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.to_user_id.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="settlement-amount"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Amount ({currency})
            </label>

            <input
              id="settlement-amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              {...register(
                "amount",
                {
                  valueAsNumber: true
                }
              )}
            />

            {errors.amount && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.amount.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="settlement-date"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Payment date
            </label>

            <input
              id="settlement-date"
              type="date"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              {...register("settlement_date")}
            />

            {errors.settlement_date && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.settlement_date.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="settlement-note"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Note
              <span className="ml-1 font-normal text-slate-400">
                (optional)
              </span>
            </label>

            <textarea
              id="settlement-note"
              rows={3}
              placeholder="For example, Hotel expense settlement"
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              {...register("note")}
            />

            {errors.note && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.note.message}
              </p>
            )}
          </div>

          {selectedSender &&
            selectedReceiver && (
              <div className="rounded-2xl bg-emerald-50 p-4 text-center text-sm text-emerald-800">
                <span className="font-semibold">
                  {selectedSender.name}
                </span>{" "}
                is paying{" "}
                <span className="font-semibold">
                  {selectedReceiver.name}
                </span>
              </div>
            )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isSaving}
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              onClick={handleClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <LoaderCircle
                    className="animate-spin"
                    size={18}
                  />
                  Recording...
                </>
              ) : (
                <>
                  <HandCoins size={18} />
                  Record payment
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}


export default SettleUpModal;
