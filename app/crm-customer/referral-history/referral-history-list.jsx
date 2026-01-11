'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Search, Settings2, Trash2, X } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { referralHistoryApi, referrersApi, adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ReferralHistoryList({ referrerId = null }) {
  const [history, setHistory] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });
  const [sorting, setSorting] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
    loadReferrers();
    loadAdmins();
  }, [referrerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = referrerId ? { referrer_id: referrerId } : {};
      const historyData = await referralHistoryApi.getAll(params);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadReferrers = async () => {
    try {
      const data = await referrersApi.getAll();
      setReferrers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load referrers:', error);
      toast.error('ไม่สามารถโหลดข้อมูลผู้แนะนำได้');
    }
  };

  const loadAdmins = async () => {
    try {
      const data = await adminApi.getAll();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load admins:', error);
      toast.error('ไม่สามารถโหลดข้อมูลผู้ดูแลระบบได้');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบประวัติการแนะนำนี้หรือไม่?')) return;
    
    try {
      await referralHistoryApi.delete(id);
      toast.success('ลบประวัติการแนะนำสำเร็จ');
      loadData();
    } catch (error) {
      console.error('Failed to delete referral history:', error);
      toast.error('ไม่สามารถลบประวัติการแนะนำได้');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      // ดึงข้อมูลเดิมก่อน
      const currentItem = history.find(item => item.id === id);
      if (!currentItem) {
        toast.error('ไม่พบข้อมูล');
        return;
      }

      // อัปเดตเฉพาะ status
      await referralHistoryApi.update(id, {
        referrer_id: currentItem.referrer_id,
        referee_id: currentItem.referee_id,
        reward_type: currentItem.reward_type,
        reward_value: currentItem.reward_value,
        status: newStatus,
      });
      
      toast.success('อัปเดตสถานะสำเร็จ');
      loadData();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('ไม่สามารถอัปเดตสถานะได้');
    }
  };

  const getReferrerName = (referrerId) => {
    const referrer = referrers.find(r => r.id === referrerId);
    return referrer?.name || '-';
  };

  const getAdminName = (adminId) => {
    const admin = admins.find(a => a.id === adminId);
    return admin ? `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || admin.username || '-' : '-';
  };

  const getRewardTypeLabel = (type) => {
    const typeMap = {
      point: 'คะแนน',
      cash: 'เงินสด',
    };
    return typeMap[type] || type;
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: 'รอดำเนินการ',
      approved: 'อนุมัติแล้ว',
      paid: 'จ่ายแล้ว',
    };
    return statusMap[status] || status;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm');
    } catch {
      return '-';
    }
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
        accessorKey: 'referrer_id',
        id: 'referrer_id',
        header: ({ column }) => (
          <DataGridColumnHeader title="ผู้แนะนำ" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const referrerId = row.original.referrer_id;
          return (
            <div className="font-medium text-foreground">
              {getReferrerName(referrerId)}
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
      },
      {
        accessorKey: 'referee_id',
        id: 'referee_id',
        header: ({ column }) => (
          <DataGridColumnHeader title="ผู้ถูกแนะนำ" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const refereeId = row.original.referee_id;
          return (
            <div className="font-medium text-foreground">
              {getAdminName(refereeId)}
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
      },
      {
        accessorKey: 'reward_type',
        id: 'reward_type',
        header: ({ column }) => (
          <DataGridColumnHeader title="ประเภทรางวัล" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="text-foreground">
              {getRewardTypeLabel(row.original.reward_type)}
            </div>
          );
        },
        size: 150,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'reward_value',
        id: 'reward_value',
        header: ({ column }) => (
          <DataGridColumnHeader title="มูลค่ารางวัล" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const value = row.original.reward_value || 0;
          const type = row.original.reward_type;
          return (
            <div className="text-foreground font-semibold">
              {type === 'cash' ? `${value.toLocaleString()} บาท` : `${value.toLocaleString()} คะแนน`}
            </div>
          );
        },
        size: 150,
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
          const itemId = row.original.id;
          return (
            <Select
              value={status}
              onValueChange={(newStatus) => handleUpdateStatus(itemId, newStatus)}>
              <SelectTrigger className="w-[150px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">รอดำเนินการ</SelectItem>
                <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                <SelectItem value="paid">จ่ายแล้ว</SelectItem>
              </SelectContent>
            </Select>
          );
        },
        size: 150,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'created_at',
        id: 'created_at',
        header: ({ column }) => (
          <DataGridColumnHeader title="วันที่สร้าง" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const createdAt = row.original.created_at;
          return (
            <div className="text-foreground">
              {formatDate(createdAt)}
            </div>
          );
        },
        size: 200,
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
    [referrers, admins]
  );

  const [columnOrder, setColumnOrder] = useState(
    columns.map((column) => column.id)
  );

  const filteredData = useMemo(() => {
    let filtered = history;

    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const referrerName = getReferrerName(item.referrer_id);
        const refereeName = getAdminName(item.referee_id);
        return (
          referrerName.toLowerCase().includes(searchLower) ||
          refereeName.toLowerCase().includes(searchLower) ||
          (item.reward_type || '').toLowerCase().includes(searchLower) ||
          (item.status || '').toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [searchQuery, history, referrers, admins]);

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
    </>
  );
}

