import { useState, useMemo, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Search as SearchIcon, SlidersHorizontal } from 'lucide-react'
import { Input } from './Input'
import { Badge } from './Badge'
import { Button } from './Button'

export interface Column<T> {
  key: keyof T | string
  header: string
  sortable?: boolean
  render?: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  searchKey?: keyof T
  filterOptions?: {
    key: keyof T
    label: string
    options: { value: string; label: string }[]
  }
  pageSize?: number
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  searchKey,
  filterOptions,
  pageSize = 10,
  className,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterValue, setFilterValue] = useState<string>('ALL')
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | string; direction: 'asc' | 'desc' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Handle Sorting
  const requestSort = (key: keyof T | string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Filter & Search & Sort Data
  const processedData = useMemo(() => {
    let result = [...data]

    // Filter
    if (filterOptions && filterValue !== 'ALL') {
      result = result.filter((row) => String(row[filterOptions.key]) === filterValue)
    }

    // Search
    if (searchKey && searchQuery) {
      result = result.filter((row) =>
        String(row[searchKey]).toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort
    if (sortConfig) {
      result.sort((a: any, b: any) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, searchQuery, filterValue, sortConfig, searchKey, filterOptions])

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return processedData.slice(start, start + pageSize)
  }, [processedData, currentPage, pageSize])

  return (
    <div className={cn('space-y-4 w-full', className)}>
      {/* Table Toolbar */}
      {(searchKey || filterOptions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {searchKey && (
            <div className="relative max-w-sm w-full">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                leftIcon={<SearchIcon size={16} />}
              />
            </div>
          )}

          {filterOptions && (
            <div className="flex items-center gap-2">
              <span className="text-muted text-xs flex items-center gap-1">
                <SlidersHorizontal size={14} /> Filter by:
              </span>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => {
                    setFilterValue('ALL')
                    setCurrentPage(1)
                  }}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-150',
                    filterValue === 'ALL'
                      ? 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_12px_rgba(79,70,229,0.1)]'
                      : 'text-muted border-white/5 hover:text-white hover:bg-white/5'
                  )}
                >
                  All
                </button>
                {filterOptions.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setFilterValue(opt.value)
                      setCurrentPage(1)
                    }}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-150',
                      filterValue === opt.value
                        ? 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_12px_rgba(79,70,229,0.1)]'
                        : 'text-muted border-white/5 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Table grid */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                {columns.map((col) => (
                  <th
                    key={col.key as string}
                    onClick={() => col.sortable && requestSort(col.key)}
                    className={cn(
                      'px-5 py-4 text-left text-[11px] uppercase tracking-wider text-muted font-semibold select-none',
                      col.sortable && 'cursor-pointer hover:text-white transition-colors duration-150'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && sortConfig?.key === col.key && (
                        sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-muted">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-b border-white/5 hover:bg-white/2 transition-colors duration-150"
                  >
                    {columns.map((col) => (
                      <td key={col.key as string} className="px-5 py-4 text-white">
                        {col.render ? col.render(row) : (row[col.key as keyof T] as ReactNode)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
