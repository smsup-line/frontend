'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Edit, Search, Settings2, Trash2, X, History, Copy, Check } from 'lucide-react';
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
import { referrersApi } from '@/lib/api';
import { toast } from 'sonner';
import { EditReferrerSheet } from './edit-referrer-sheet';
import { useRouter } from 'next/navigation';

export default function ReferrersList() {
  const [referrers, setReferrers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });
  const [sorting, setSorting] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editReferrer, setEditReferrer] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const router = useRouter();
  
  const referrerUrl = process.env.NEXT_PUBLIC_REFERRER_URL || 'https://yourdomain.com';
  
  const handleCopyLink = useMemo(() => {
    return async (referralCode) => {
      const link = `${referrerUrl}/register?ref=${referralCode}`;
      try {
        await navigator.clipboard.writeText(link);
        setCopiedId(referralCode);
        toast.success('คัดลอกลิงก์สำเร็จ');
        setTimeout(() => setCopiedId(null), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
        toast.error('ไม่สามารถคัดลอกลิงก์ได้');
      }
    };
  }, [referrerUrl]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const referrersData = await referrersApi.getAll();
      setReferrers(Array.isArray(referrersData) ? referrersData : []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
      setReferrers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบผู้แนะนำนี้หรือไม่?')) return;
    
    try {
      await referrersApi.delete(id);
      toast.success('ลบผู้แนะนำสำเร็จ');
      loadData();
    } catch (error) {
      console.error('Failed to delete referrer:', error);
      toast.error('ไม่สามารถลบผู้แนะนำได้');
    }
  };

  const handleEdit = (referrer) => {
    setEditReferrer(referrer);
    setIsEditOpen(true);
  };

  const handleViewHistory = (referrerId) => {
    router.push(`/crm-customer/referral-history?referrer_id=${referrerId}`);
  };


  const getStatusLabel = (status) => {
    const statusMap = {
      open: 'เปิด',
      close: 'ปิด',
    };
    return statusMap[status] || status;
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
          <DataGridColumnHeader title="ชื่อ" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="text-foreground">
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
        accessorKey: 'referral_code',
        id: 'referral_code',
        header: ({ column }) => (
          <DataGridColumnHeader title="รหัสแนะนำ" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const referralCode = row.original.referral_code || row.original.referralcode || '-';
          return (
            <div className="font-mono text-sm text-foreground">
              {referralCode}
            </div>
          );
        },
        size: 250,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'referral_link',
        id: 'referral_link',
        header: ({ column }) => (
          <DataGridColumnHeader title="ลิงก์แนะนำ" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const referralCode = row.original.referral_code || row.original.referralcode;
          if (!referralCode) return <div className="text-muted-foreground">-</div>;
          
          const link = `${referrerUrl}/register?ref=${referralCode}`;
          const isCopied = copiedId === referralCode;
          
          return (
            <div className="flex items-center gap-2">
              <div className="truncate max-w-[300px] text-sm text-foreground font-mono">
                {link}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopyLink(referralCode)}
                className="h-7 w-7 p-0"
                title="คัดลอกลิงก์">
                {isCopied ? (
                  <Check className="size-3 text-green-600" />
                ) : (
                  <Copy className="size-3" />
                )}
              </Button>
            </div>
          );
        },
        size: 400,
        enableSorting: false,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'bank',
        id: 'bank',
        header: ({ column }) => (
          <DataGridColumnHeader title="ธนาคาร" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="text-foreground">
              {row.original.bank || '-'}
            </div>
          );
        },
        size: 150,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'reward_type',
        id: 'reward_type',
        header: ({ column }) => (
          <DataGridColumnHeader title="ประเภทรางวัล" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const rewardType = row.original.reward_type || 'point';
          return (
            <div className="text-foreground font-semibold">
              {rewardType === 'point' ? 'คะแนนสะสม' : rewardType === 'cash' ? 'เงินสด' : rewardType}
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
            <div className="truncate max-w-[200px] text-foreground">
              {row.original.description || '-'}
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: ({ column }) => (
          <DataGridColumnHeader title="สถานะ" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <div className="text-foreground">
              {getStatusLabel(status)}
            </div>
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
                onClick={() => handleViewHistory(row.original.id)}
                className="h-8 w-8 p-0"
                title="ดูประวัติการแนะนำ">
                <History className="size-4" />
              </Button>
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
        size: 150,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [referrerUrl, copiedId]
  );

  const [columnOrder, setColumnOrder] = useState(
    columns.map((column) => column.id)
  );

  const filteredData = useMemo(() => {
    let filtered = referrers;

    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const referralCode = item.referral_code || item.referralcode || '';
        return (
          (item.name || '').toLowerCase().includes(searchLower) ||
          (item.bank || '').toLowerCase().includes(searchLower) ||
          (item.description || '').toLowerCase().includes(searchLower) ||
          referralCode.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [searchQuery, referrers]);

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
                    className="ps-9 w-40"
                  />
                  {searchQuery.length > 0 && (
                    <Button
                      mode="icon"
                      variant="ghost"
                      className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                      onClick={() => setSearchQuery('')}>
                      <X />
                    </Button>
                  )}
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
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>

          <CardFooter className="px-4 py-0">
            <DataGridPagination
              className="py-1"
              sizes={[5, 10, 15, 30, 50, 100]}
            />
          </CardFooter>
        </Card>
      </DataGrid>
      <EditReferrerSheet
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        referrer={editReferrer}
        onSuccess={() => {
          loadData();
          setEditReferrer(null);
        }}
      />
    </>
  );
}

