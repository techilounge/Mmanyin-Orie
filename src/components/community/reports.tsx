
'use client';
import { useState } from 'react';
import { useCommunity } from '@/hooks/use-community';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Download, FileText, Loader2 } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { generatePdf, generateCsv } from '@/lib/report-utils';
import { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import { CustomContribution } from '@/lib/types';

const reportTypes = [
  { value: 'member-list', label: 'Member List' },
  { value: 'payment-report', label: 'Payment Report' },
  { value: 'contribution-summary', label: 'Contribution Summary' },
];

export function Reports() {
  const { members, settings, families, customContributions, getPaidAmountForContribution } = useCommunity();
  const [reportType, setReportType] = useState('member-list');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = async (formatType: 'pdf' | 'csv') => {
    setIsGenerating(true);
    try {
      let data: any[] = [];
      let headers: string[] = [];
      let filename = `${reportType}_${new Date().toISOString().split('T')[0]}`;
      let title = reportTypes.find(rt => rt.value === reportType)?.label || 'Report';

      switch(reportType) {
        case 'member-list':
          headers = ['Name', 'Family', 'Age Group', 'Email', 'Phone', 'Total Owed'];
          data = members.map(m => ({
            'Name': m.name,
            'Family': m.family,
            'Age Group': m.tier,
            'Email': m.email,
            'Phone': `${m.phoneCountryCode || ''} ${m.phone || ''}`.trim(),
            'Total Owed': `${settings.currency}${m.contribution.toLocaleString()}`
          }));
          break;
        
        case 'payment-report':
           headers = ['Member Name', 'Family', 'Contribution', 'Payment Date', 'Amount'];
           title = `Payment Report (${format(dateRange?.from!, 'LLL dd')} - ${format(dateRange?.to!, 'LLL dd, y')})`
           data = members.flatMap(m => 
              (m.payments || [])
                .filter(p => {
                  const paymentDate = new Date(p.date);
                  const from = dateRange?.from;
                  const to = dateRange?.to;
                  return (!from || paymentDate >= from) && (!to || paymentDate <= to);
                })
                .map(p => {
                  const contribution = customContributions.find(c => c.id === p.contributionId);
                  return {
                    'Member Name': m.name,
                    'Family': m.family,
                    'Contribution': contribution?.name || 'N/A',
                    'Payment Date': format(new Date(p.date), 'PPP'),
                    'Amount': `${settings.currency}${p.amount.toLocaleString()}`
                  }
                })
            );
          break;
        
        case 'contribution-summary':
            headers = ['Contribution', 'Total Expected', 'Total Paid', 'Total Outstanding'];
            data = customContributions.map((c: CustomContribution) => {
                let totalExpected = 0;
                let totalPaid = 0;
                
                members.forEach(m => {
                    if (c.tiers.includes(m.tier)) {
                       totalExpected += c.amount;
                       totalPaid += getPaidAmountForContribution(m, c.id);
                    }
                });

                return {
                    'Contribution': c.name,
                    'Total Expected': `${settings.currency}${totalExpected.toLocaleString()}`,
                    'Total Paid': `${settings.currency}${totalPaid.toLocaleString()}`,
                    'Total Outstanding': `${settings.currency}${(totalExpected - totalPaid).toLocaleString()}`,
                }
            });
          break;
      }

      if (data.length === 0) {
        toast({
          variant: "default",
          title: "No Data",
          description: "There is no data to export for the selected criteria.",
        });
        return;
      }

      if (formatType === 'pdf') {
        generatePdf(title, headers, data);
      } else {
        generateCsv(`${filename}.csv`, data);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate the report. Please try again.",
      })
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
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download as PDF
          </Button>
          <Button onClick={() => handleDownload('csv')} variant="outline" disabled={isGenerating}>
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download as CSV
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
