import { toast } from "sonner";

export const notifications = {
  success: (message, description) => {
    toast.success(message, {
      description,
      duration: 4000,
    });
  },
  error: (message, description) => {
    toast.error(message, {
      description,
      duration: 5000,
    });
  },
  loading: (promise, messages) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  },
};
