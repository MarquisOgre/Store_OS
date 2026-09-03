import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "date" | "email";
  options?: { label: string; value: string }[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  colSpan?: 1 | 2;
}

export type FormValues = Record<string, string>;

export function RecordFormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initial,
  onSubmit,
  allowSaveAndAdd = false,
  submitLabel = "Save",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldDef[];
  initial?: FormValues;
  onSubmit: (values: FormValues) => void;
  allowSaveAndAdd?: boolean;
  submitLabel?: string;
}) {
  const blank = () =>
    fields.reduce<FormValues>((acc, f) => {
      acc[f.name] = initial?.[f.name] ?? "";
      return acc;
    }, {});
  const [values, setValues] = useState<FormValues>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setValues(blank());
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const validate = () => {
    const next: Record<string, string> = {};
    for (const f of fields) {
      const v = (values[f.name] ?? "").trim();
      if (f.required && !v) next[f.name] = `${f.label} is required`;
      else if (f.type === "number" && v && Number.isNaN(Number(v))) next[f.name] = "Enter a valid number";
      else if (f.type === "email" && v && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v)) next[f.name] = "Enter a valid email";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = (keepOpen: boolean) => {
    if (!validate()) return;
    onSubmit(values);
    if (keepOpen) {
      setValues(fields.reduce<FormValues>((acc, f) => ({ ...acc, [f.name]: "" }), {}));
      setErrors({});
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.name} className={f.colSpan === 2 || f.type === "textarea" ? "sm:col-span-2" : ""}>
              <Label htmlFor={f.name} className="mb-1.5 text-[12px] font-medium">
                {f.label}
                {f.required && <span className="text-coral ml-0.5">*</span>}
              </Label>
              {f.type === "select" ? (
                <Select value={values[f.name] ?? ""} onValueChange={(v) => setValues((p) => ({ ...p, [f.name]: v }))}>
                  <SelectTrigger id={f.name} className="w-full bg-card">
                    <SelectValue placeholder={f.placeholder ?? `Select ${f.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(f.options ?? []).map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.type === "textarea" ? (
                <Textarea
                  id={f.name}
                  value={values[f.name] ?? ""}
                  placeholder={f.placeholder}
                  className="bg-card"
                  onChange={(e) => setValues((p) => ({ ...p, [f.name]: e.target.value }))}
                />
              ) : (
                <Input
                  id={f.name}
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                  value={values[f.name] ?? ""}
                  placeholder={f.placeholder}
                  className="bg-card"
                  onChange={(e) => setValues((p) => ({ ...p, [f.name]: e.target.value }))}
                />
              )}
              {errors[f.name] ? (
                <p className="text-coral mt-1 text-[11px]">{errors[f.name]}</p>
              ) : (
                f.help && <p className="text-muted-foreground mt-1 text-[11px]">{f.help}</p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {allowSaveAndAdd && (
            <Button variant="outline" onClick={() => save(true)}>
              Save &amp; add another
            </Button>
          )}
          <Button onClick={() => save(false)}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
