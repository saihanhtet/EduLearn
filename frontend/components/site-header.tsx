import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader({ title, is_student }: { title: string, is_student: boolean }) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        {/* <div className="ml-auto flex items-center gap-2">
          {!is_student && (
            <Button variant="ghost" asChild size="icon" className="hidden sm:flex w-auto">
              <Link
                href="/staff"
                className="dark:text-foreground px-3"
              >
                Staff
              </Link>
            </Button>
          )}
        </div> */}
      </div>
    </header>
  )
}
