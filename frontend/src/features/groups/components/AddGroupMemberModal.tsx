import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import axios from "axios";
import {
  LoaderCircle,
  UserPlus,
  X
} from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import {
  addGroupMember
} from "../api/addGroupMember";
import {
  addGroupMemberSchema,
  type AddGroupMemberFormValues
} from "../schemas/addGroupMemberSchema";


interface AddGroupMemberModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
}


interface ApiErrorResponse {
  detail?: string;
}


function AddGroupMemberModal({
  groupId,
  isOpen,
  onClose
}: AddGroupMemberModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<AddGroupMemberFormValues>({
    resolver: zodResolver(
      addGroupMemberSchema
    ),

    defaultValues: {
      email: ""
    }
  });

  const addMemberMutation = useMutation({
    mutationFn: addGroupMember,

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "groups",
            groupId
          ]
        }),

        queryClient.invalidateQueries({
          queryKey: ["groups"]
        })
      ]);

      reset();
      onClose();
    }
  });

  const isAdding =
    isSubmitting ||
    addMemberMutation.isPending;


  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape" &&
        !addMemberMutation.isPending
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
    onClose,
    addMemberMutation.isPending
  ]);


  async function onSubmit(
    data: AddGroupMemberFormValues
  ) {
    try {
      await addMemberMutation.mutateAsync({
        groupId,
        payload: data
      });
    } catch {
      // React Query stores the API error.
    }
  }


  function handleClose() {
    if (isAdding) {
      return;
    }

    addMemberMutation.reset();
    reset();
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
        aria-labelledby="add-member-title"
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <UserPlus size={22} />
            </span>

            <div>
              <h2
                id="add-member-title"
                className="text-xl font-bold text-slate-950"
              >
                Add group member
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add an existing SplitNest user.
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close add member modal"
            disabled={isAdding}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
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
          {addMemberMutation.isError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {axios.isAxiosError<ApiErrorResponse>(
                addMemberMutation.error
              )
                ? addMemberMutation.error.response
                    ?.data.detail ??
                  "Unable to add this member."
                : "Unable to add this member."}
            </div>
          )}

          <div>
            <label
              htmlFor="member-email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Member email address
            </label>

            <input
              id="member-email"
              type="email"
              autoFocus
              placeholder="member@example.com"
              className={`w-full rounded-xl border px-4 py-3 outline-none transition ${
                errors.email
                  ? "border-red-400 focus:ring-4 focus:ring-red-100"
                  : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              }`}
              aria-invalid={Boolean(
                errors.email
              )}
              {...register("email")}
            />

            {errors.email && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}

            <p className="mt-2 text-xs leading-5 text-slate-400">
              The person must already have a
              SplitNest account.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isAdding}
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              onClick={handleClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isAdding}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAdding ? (
                <>
                  <LoaderCircle
                    className="animate-spin"
                    size={18}
                  />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Add member
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}


export default AddGroupMemberModal;