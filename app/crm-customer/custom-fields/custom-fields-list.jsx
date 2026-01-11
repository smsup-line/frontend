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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { customFieldsApi, storeApi } from '@/lib/api';
import { toast } from 'sonner';
import { EditCustomFieldSheet } from './edit-custom-field-sheet';

export default function CustomFieldsList() {
  const [customFields, setCustomFields] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });
  const [sorting, setSorting] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');
  const [editField, setEditField] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userStoreId, setUserStoreId] = useState(null);

  useEffect(() => {
    loadUserInfo();
    loadStores();
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [storeFilter]);

  const loadUserInfo = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserRole(user.role);
          setUserStoreId(user.shop_id || user.storeId);
          if (user.role !== 'superadmin') {
            setStoreFilter(user.shop_id || user.storeId || 'all');
          }
        } catch (e) {
          console.error('Failed to parse user info:', e);
        }
      }
    }
  };

  const loadStores = async () => {
    try {
      const data = await storeApi.getAll();
      setStores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const params = storeFilter !== 'all' ? { shop_id: storeFilter } : {};
      const data = await customFieldsApi.getAll(params);
      setCustomFields(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load custom fields:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
      setCustomFields([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบ Custom Field นี้หรือไม่?')) return;
    
    try {
      await customFieldsApi.delete(id);
      toast.success('ลบ Custom Field สำเร็จ');
      loadData();
    } catch (error) {
      console.error('Failed to delete custom field:', error);
      toast.error('ไม่สามารถลบ Custom Field ได้');
    }
  };

  const handleEdit = (field) => {
    setEditField(field);
    setIsEditOpen(true);
  };

  const getStoreName = (shopId) => {
    const store = stores.find((s) => s.id === shopId);
    return store?.name || '-';
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
        accessorKey: 'shop_id',
        id: 'shop_id',
        header: ({ column }) => (
          <DataGridColumnHeader title="รหัสร้านค้า" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="text-foreground">
              {getStoreName(row.original.shop_id)}
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: userRole === 'superadmin',
        enableResizing: true,
      },
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => (
          <DataGridColumnHeader title="ชื่อฟิลด์" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="font-medium text-foreground">
              {row.original.name}
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
      },
      {
        accessorKey: 'field_key',
        id: 'field_key',
        header: ({ column }) => (
          <DataGridColumnHeader title="Field Key" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="text-foreground font-mono text-sm">
              {row.original.field_key}
            </div>
          );
        },
        size: 150,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'description',
        id: 'description',
        header: ({ column }) => (
          <DataGridColumnHeader title="รายละเอียด" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="truncate max-w-[300px]">
              {row.original.description || '-'}
            </div>
          );
        },
        size: 300,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'field_type',
        id: 'field_type',
        header: ({ column }) => (
          <DataGridColumnHeader title="ประเภทฟิลด์" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const fieldType = row.original.field_type || 'text';
          const typeLabels = {
            text: 'Text',
            number: 'Number',
            date: 'Date',
            boolean: 'Boolean',
            select: 'Select',
            multi_select: 'Multi Select',
            email: 'Email',
            phone: 'Phone',
          };
          return (
            <Badge variant="outline">
              {typeLabels[fieldType] || fieldType}
            </Badge>
          );
        },
        size: 120,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'field_order',
        id: 'field_order',
        header: ({ column }) => (
          <DataGridColumnHeader title="ลำดับ" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="text-foreground text-center">
              {row.original.field_order ?? row.original.fieldOrder ?? 0}
            </div>
          );
        },
        size: 80,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'is_required',
        id: 'is_required',
        header: ({ column }) => (
          <DataGridColumnHeader title="จำเป็น" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const isRequired = row.original.is_required ?? row.original.isRequired ?? false;
          return (
            <Badge variant={isRequired ? 'destructive' : 'secondary'}>
              {isRequired ? 'จำเป็น' : 'ไม่จำเป็น'}
            </Badge>
          );
        },
        size: 100,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'is_exportable',
        id: 'is_exportable',
        header: ({ column }) => (
          <DataGridColumnHeader title="Export" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const isExportable = row.original.is_exportable ?? row.original.isExportable ?? true;
          return (
            <Badge variant={isExportable ? 'default' : 'secondary'}>
              {isExportable ? 'ได้' : 'ไม่ได้'}
            </Badge>
          );
        },
        size: 80,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'is_importable',
        id: 'is_importable',
        header: ({ column }) => (
          <DataGridColumnHeader title="Import" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const isImportable = row.original.is_importable ?? row.original.isImportable ?? true;
          return (
            <Badge variant={isImportable ? 'default' : 'secondary'}>
              {isImportable ? 'ได้' : 'ไม่ได้'}
            </Badge>
          );
        },
        size: 80,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'is_visible',
        id: 'is_visible',
        header: ({ column }) => (
          <DataGridColumnHeader title="สถานะแสดง" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const isVisible = row.original.is_visible ?? row.original.isVisible ?? true;
          return (
            <Badge variant={isVisible ? 'default' : 'secondary'}>
              {isVisible ? 'แสดง' : 'ไม่แสดง'}
            </Badge>
          );
        },
        size: 120,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'is_enabled',
        id: 'is_enabled',
        header: ({ column }) => (
          <DataGridColumnHeader title="สถานะเปิด" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const isEnabled = row.original.is_enabled ?? row.original.isEnabled ?? true;
          return (
            <Badge variant={isEnabled ? 'default' : 'destructive'}>
              {isEnabled ? 'เปิด' : 'ปิด'}
            </Badge>
          );
        },
        size: 120,
        enableSorting: true,
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
    [stores, userRole]
  );

  const [columnOrder, setColumnOrder] = useState(
    columns.map((column) => column.id)
  );

  const filteredData = useMemo(() => {
    let filtered = customFields;

    if (userRole === 'admin' && userStoreId) {
      filtered = filtered.filter((item) => item.shop_id === userStoreId);
    } else if (userRole === 'superadmin' && storeFilter !== 'all') {
      filtered = filtered.filter((item) => item.shop_id === storeFilter);
    }

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        return (
          (item.name || '').toLowerCase().includes(searchLower) ||
          (item.field_key || '').toLowerCase().includes(searchLower) ||
          (item.description || '').toLowerCase().includes(searchLower) ||
          getStoreName(item.shop_id).toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [searchQuery, storeFilter, customFields, stores, userRole, userStoreId]);

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
                {userRole === 'superadmin' && (
                  <Select value={storeFilter} onValueChange={setStoreFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="เลือกร้านค้า" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
      <EditCustomFieldSheet
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        customField={editField}
        stores={stores}
        onSuccess={loadData}
      />
    </>
  );
}



