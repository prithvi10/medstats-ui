import { useState, type ReactNode, type Ref } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewWorkspacePanelProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  panelRef?: Ref<HTMLElement>;
  children: ReactNode;
}

export function ReviewWorkspacePanel({
  title,
  subtitle,
  icon,
  className,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  panelRef,
  children,
}: ReviewWorkspacePanelProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const toggle = () => {
    const next = !open;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <section
      ref={panelRef}
      className={cn(
        'flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden',
        className
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={cn(
          'flex-shrink-0 w-full px-6 py-5 text-left transition-colors',
          'bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50',
          open ? 'border-b border-gray-100' : ''
        )}
      >
        <div className="flex items-start gap-4">
          {icon && (
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <ChevronDown
            className={cn(
              'w-5 h-5 text-gray-400 flex-shrink-0 mt-1 transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </div>
      </button>

      {open && <div className="p-6 md:p-8">{children}</div>}
    </section>
  );
}
