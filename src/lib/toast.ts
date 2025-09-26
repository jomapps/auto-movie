import toast from "react-hot-toast"

// Toast notification utilities with consistent styling and behavior
// Based on clarified requirement for minimal visual feedback through toast notifications only

interface ToastOptions {
  duration?: number
  position?: "top-center" | "top-right" | "bottom-center" | "bottom-right"
}

const defaultOptions: ToastOptions = {
  duration: 4000,
  position: "top-right",
}

export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      duration: options?.duration ?? defaultOptions.duration,
      position: options?.position ?? defaultOptions.position,
      style: {
        background: "#10b981",
        color: "#fff",
        fontWeight: "500",
      },
      iconTheme: {
        primary: "#fff",
        secondary: "#10b981",
      },
    })
  },

  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      duration: options?.duration ?? defaultOptions.duration,
      position: options?.position ?? defaultOptions.position,
      style: {
        background: "#ef4444",
        color: "#fff",
        fontWeight: "500",
      },
      iconTheme: {
        primary: "#fff",
        secondary: "#ef4444",
      },
    })
  },

  loading: (message: string) => {
    return toast.loading(message, {
      style: {
        background: "#3b82f6",
        color: "#fff",
        fontWeight: "500",
      },
      iconTheme: {
        primary: "#fff",
        secondary: "#3b82f6",
      },
    })
  },

  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId)
    } else {
      toast.dismiss()
    }
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
    options?: ToastOptions
  ) => {
    return toast.promise(
      promise,
      messages,
      {
        style: {
          minWidth: "250px",
          fontWeight: "500",
        },
        success: {
          duration: options?.duration ?? defaultOptions.duration,
          style: {
            background: "#10b981",
            color: "#fff",
          },
        },
        error: {
          duration: options?.duration ?? defaultOptions.duration,
          style: {
            background: "#ef4444",
            color: "#fff",
          },
        },
        loading: {
          style: {
            background: "#3b82f6",
            color: "#fff",
          },
        },
      }
    )
  },
}

// Project-specific toast messages
export const projectToast = {
  created: () => showToast.success("Project created successfully"),
  updated: () => showToast.success("Project updated successfully"),
  deleted: () => showToast.success("Project deleted successfully"),
  
  createError: (error?: string) => 
    showToast.error(error || "Failed to create project. Please try again."),
  updateError: (error?: string) => 
    showToast.error(error || "Failed to update project. Please try again."),
  deleteError: (error?: string) => 
    showToast.error(error || "Failed to delete project. Please try again."),
  
  loadError: () => 
    showToast.error("Failed to load projects. Please refresh the page and try again."),
  
  networkError: () => 
    showToast.error("Network error. Please check your connection and try again manually."),
  
  validationError: () => 
    showToast.error("Please fix the errors in the form before submitting."),
}