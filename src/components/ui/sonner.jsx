import { Toaster as Sonner } from "sonner"

const Toaster = (props) => {
  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  return <Sonner theme={theme} className="toaster group" {...props} />
}

export { Toaster }
