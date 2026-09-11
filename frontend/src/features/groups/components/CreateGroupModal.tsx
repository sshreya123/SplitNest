import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import axios from "axios";
import {
  LoaderCircle,
  UsersRound,
  X
} from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { createGroup } from "../api/createGroup";
import {
  createGroupSchema,
  type CreateGroupFormValues
} from "../schemas/createGroupSchema";


interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}


interface ApiErrorResponse {
  detail?: string;
}


function CreateGroupModal({
  isOpen,
  onClose
}: CreateGroupModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),

    defaultValues: {
      name: "",
      description: "",
      default_currency: "INR"
    }
  });

  const createGroupMutation = useMutation({
    mutationFn: createGroup,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["groups"]
      });

      reset();
      onClose();
    }
  });

  const isCreating =
    isSubmitting ||
    createGroupMutation.isPending;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key === "Escape" &&
        !createGroupMutation.isPending
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
    createGroupMutation.isPending
  ]);

  async function onSubmit(
    data: CreateGroupFormValues
  ) {
    try {
      await createGroupMutation.mutateAsync(data);
    } catch {
      // The mutation stores the API error.
    }
  }

  function handleClose() {
    if (isCreating) {
      return;
    }

    createGroupMutation.reset();
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
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-group-title"
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <UsersRound size={22} />
            </span>

            <div>
              <h2
                id="create-group-title"
                className="text-xl font-bold text-slate-950"
              >
                Create a group
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Start sharing expenses with others.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close create group modal"
            disabled={isCreating}
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
          {createGroupMutation.isError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {axios.isAxiosError<ApiErrorResponse>(
                createGroupMutation.error
              )
                ? createGroupMutation.error.response
                    ?.data.detail ??
                  "Unable to create the group."
                : "Unable to create the group."}
            </div>
          )}

          <div>
            <label
              htmlFor="group-name"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Group name
            </label>

            <input
              id="group-name"
              type="text"
              autoFocus
              placeholder="For example, Goa Trip"
              className={`w-full rounded-xl border px-4 py-3 outline-none transition ${
                errors.name
                  ? "border-red-400 focus:ring-4 focus:ring-red-100"
                  : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              }`}
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />

            {errors.name && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="group-description"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Description
              <span className="ml-1 font-normal text-slate-400">
                (optional)
              </span>
            </label>

            <textarea
              id="group-description"
              rows={4}
              placeholder="What expenses will this group manage?"
              className={`w-full resize-none rounded-xl border px-4 py-3 outline-none transition ${
                errors.description
                  ? "border-red-400 focus:ring-4 focus:ring-red-100"
                  : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              }`}
              aria-invalid={Boolean(
                errors.description
              )}
              {...register("description")}
            />

            {errors.description && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="group-currency"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Default currency
            </label>

            <select
              id="group-currency"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              {...register("default_currency")}
            >
              <option value="INR">
                INR — Indian Rupee
              </option>

              <option value="USD">
                USD — US Dollar
              </option>

              <option value="EUR">
                EUR — Euro
              </option>

              <option value="GBP">
                GBP — British Pound
              </option>
            </select>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isCreating}
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              onClick={handleClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating && (
                <LoaderCircle
                  className="animate-spin"
                  size={18}
                />
              )}

              {isCreating
                ? "Creating group..."
                : "Create group"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default CreateGroupModal;