
'use client';
import { useState } from 'react';
import { useCommunity } from '@/hooks/use-community';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Download, FileText } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { generatePdf, generateCsv } from '@/lib/report-utils';
import { DateRange } from 'react-day-picker';

const reportTypes = [
  { value: 'member-list', label: 'Member List' },
  { value: 'payment-report', label: 'Payment Report' },
];

export function Reports() {
  const { members, settings, families } = useCommunity();
  const [reportType, setReportType] = useState('member-list');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async (format: 'pdf' | 'csv') => {
    setIsGenerating(true);
    try {
      if (reportType === 'member-list') {
        const data = members.map(m => ({
          'Name': m.name,
          'Family': m.family,
          'Age Group': m.tier,
          'Email': m.email,
          'Phone': `${m.phoneCountryCode || ''} ${m.phone || ''}`.trim(),
          'Contribution': `${settings.currency}${m.contribution.toLocaleString()}`
        }));
        if (format === 'pdf') {
          generatePdf('Member List', ['Name', 'Family', 'Age Group', 'Email', 'Phone', 'Contribution'], data);
        } else {
          generateCsv('member_list.csv', data);
        }
      } else if (reportType === 'payment-report') {
        const data = members.flatMap(m => 
          (m.payments || [])
            .filter(p => {
              const paymentDate = new Date(p.date);
              const from = dateRange?.from;
              const to = dateRange?.to;
              return (!from || paymentDate >= from) && (!to || paymentDate <= to);
            })
            .map(p => ({
              'Member Name': m.name,
              'Family': m.family,
              'Payment Date': format(new Date(p.date), 'PPP'),
              'Amount': `${settings.currency}${p.amount.toLocaleString()}`
            }))
        );

        if (format === 'pdf') {
          generatePdf('Payment Report', ['Member Name', 'Family', 'Payment Date', 'Amount'], data);
        } else {
          generateCsv('payment_report.csv', data);
        }
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="text-primary" />
            Generate Reports
          </CardTitle>
          <CardDescription>
            Select a report type and desired format to download your community data.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue placeholder="Select a report type" />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map(rt => (
                <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {reportType === 'payment-report' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </CardContent>
        <CardFooter className="gap-4">
          <Button onClick={() => handleDownload('pdf')} disabled={isGenerating}>
            <Download className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generating PDF...' : 'Download as PDF'}
          </Button>
          <Button onClick={() => handleDownload('csv')} variant="outline" disabled={isGenerating}>
            <Download className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generating CSV...' : 'Download as CSV'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
