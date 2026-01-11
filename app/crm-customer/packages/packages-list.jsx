'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Edit, Search, Settings2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardToolbar,
} from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridColumnVisibility } from '@/components/ui/data-grid-column-visibility';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { packagesApi } from '@/lib/api';
import { toast } from 'sonner';
import { EditPackageSheet } from './edit-package-sheet';

export default function PackagesList({ refreshKey = 0 }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });
  const [sorting, setSorting] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editPackage, setEditPackage] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await packagesApi.getAll();
      setPackages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load packages:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบแพ็คเกจนี้หรือไม่?')) return;
    
    try {
      await packagesApi.delete(id);
      toast.success('ลบแพ็คเกจสำเร็จ');
      loadData();
    } catch (error) {
      console.error('Failed to delete package:', error);
      toast.error('ไม่สามารถลบแพ็คเกจได้');
    }
  };

  const handleEdit = (pkg) => {
    setEditPackage(pkg);
    setIsEditOpen(true);
  };

  const getMenuNames = (menus) => {
    if (!menus || !Array.isArray(menus) || menus.length === 0) {
      return 'ทั้งหมด';
    }
    return menus.map(m => m.name || m.menu_key || '-').join(', ');
  };

  const formatPrice = (price) => {
    if (price === 0 || price === null || price === undefined) {
      return 'Free';
    }
    return `฿${price.toLocaleString()}`;
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'id',
        id: 'id',
        header: () => <DataGridTableRowSelectAll size="sm" />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} size="sm" />,
        enableSorting: false,
        size: 40,
        meta: {
          headerClassName: 'ps-4',
          cellClassName: 'ps-4',
        },
        enableHiding: false,
        enableResizing: false,
      },
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => (
          <DataGridColumnHeader title="ชื่อแพ็คเกจ" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="font-medium text-foreground">
              {row.original.name || '-'}
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
      },
      {
        accessorKey: 'duration_days',
        id: 'duration_days',
        header: ({ column }) => (
          <DataGridColumnHeader title="ระยะเวลา (วัน)" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const days = row.original.duration_days || row.original.durationDays || 0;
          return (
            <div className="text-foreground">
              {days} วัน
            </div>
          );
        },
        size: 150,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'price',
        id: 'price',
        header: ({ column }) => (
          <DataGridColumnHeader title="ราคา" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const price = row.original.price || 0;
          return (
            <div className="text-foreground font-semibold">
              {formatPrice(price)}
            </div>
          );
        },
        size: 120,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'menus',
        id: 'menus',
        header: ({ column }) => (
          <DataGridColumnHeader title="สิทธิ์เมนู" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const menus = row.original.menus || [];
          const menuNames = getMenuNames(menus);
          return (
            <div className="truncate max-w-[300px]" title={menuNames}>
              {menuNames}
            </div>
          );
        },
        size: 300,
        enableSorting: false,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'actions',
        id: 'actions',
        header: () => <div className="text-center">จัดการ</div>,
        cell: ({ row }) => {
          return (
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEdit(row.original)}
                className="h-8 w-8 p-0">
                <Edit className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(row.original.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        },
        size: 100,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    []
  );

  const [columnOrder, setColumnOrder] = useState(
    columns.map((column) => column.id)
  );

  const filteredData = useMemo(() => {
    let filtered = packages;

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        return (
          (item.name || '').toLowerCase().includes(searchLower) ||
          (item.price?.toString() || '').includes(searchLower)
        );
      });
    }

    return filtered;
  }, [searchQuery, packages]);

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row) => row.id?.toString() || Math.random().toString(),
    state: {
      pagination,
      sorting,
      columnOrder,
    },
    columnResizeMode: 'onChange',
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <>
      <DataGrid
        table={table}
        recordCount={filteredData?.length || 0}
        tableClassNames={{
          bodyRow: 'group/row',
        }}
        tableLayout={{
          dense: true,
          columnsPinnable: true,
          columnsResizable: true,
          columnsMovable: true,
          columnsVisibility: true,
        }}>
        <Card className="border-none shadow-none">
          <CardHeader className="px-4 py-3">
            <CardHeading>
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                  <Input
                    variant="sm"
                    placeholder="ค้นหา..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-9 w-64"
                  />
                </div>
              </div>
            </CardHeading>
            <CardToolbar>
              <DataGridColumnVisibility
                table={table}
                trigger={
                  <Button size="sm" variant="outline">
                    <Settings2 />
                    การตั้งค่าการแสดงผล
                  </Button>
                }
              />
            </CardToolbar>
          </CardHeader>
          <CardTable>
            <ScrollArea className="h-[calc(100dvh-20rem)]">
              <DataGridTable table={table} />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter className="px-4 py-3">
            <DataGridPagination table={table} />
          </CardFooter>
        </Card>
      </DataGrid>
      <EditPackageSheet
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        package={editPackage}
        onSuccess={loadData}
      />
    </>
  );
}

