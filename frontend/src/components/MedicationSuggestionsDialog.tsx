import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MedicationSuggestionsDialogProps {
  trigger: React.ReactNode;
}

const MedicationSuggestionsDialog: React.FC<MedicationSuggestionsDialogProps> = ({ trigger }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Medication Suggestions & Abbreviations</DialogTitle>
          <DialogDescription>
            Common medications and their abbreviations for quick reference
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          <div>
            <h3 className="font-medium mb-2">Common Medications</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="font-medium">Medication</div>
                <div className="font-medium">Shorthand</div>
                <div className="font-medium">Common Dosage</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>Amoxicillin</div>
                <div>Amox</div>
                <div>500mg TID × 7d</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>Paracetamol</div>
                <div>PCM</div>
                <div>500mg QID PRN</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>Ibuprofen</div>
                <div>Ibu</div>
                <div>400mg TID × 5d</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>Cetirizine</div>
                <div>Cet</div>
                <div>10mg OD × 14d</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>Omeprazole</div>
                <div>Ome</div>
                <div>20mg OD × 14d</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>Metformin</div>
                <div>Met</div>
                <div>500mg BID × 30d</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>Atorvastatin</div>
                <div>Ator</div>
                <div>20mg OD × 30d</div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Common Abbreviations</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Abbreviation</div>
                <div className="font-medium">Meaning</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>OD</div>
                <div>Once daily</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>BID</div>
                <div>Twice daily</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>TID</div>
                <div>Three times daily</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>QID</div>
                <div>Four times daily</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>PRN</div>
                <div>As needed</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>PO</div>
                <div>By mouth</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>SC</div>
                <div>Subcutaneous</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>IM</div>
                <div>Intramuscular</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>IV</div>
                <div>Intravenous</div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MedicationSuggestionsDialog;
