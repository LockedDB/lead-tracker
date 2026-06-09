'use client'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'

export function CollapsibleSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Disclosure>
      <DisclosureButton className="w-full border-t border-neutral-100 py-2.5 text-left text-xs font-medium text-neutral-400 hover:text-neutral-600">
        {title}
      </DisclosureButton>
      <DisclosurePanel className="pb-3 text-sm text-neutral-700">
        {children}
      </DisclosurePanel>
    </Disclosure>
  )
}
