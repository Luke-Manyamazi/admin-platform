'use client';

import type { Metadata } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, Card, Input } from '@admin-platform/ui';
import { parseZarToCents, formatZar } from '@/lib/format';
import type { CreateOrderDto } from '@admin-platform/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCT_CATEGORIES = [
  'TEXTILES',
  'AUTOMOTIVE_PARTS',
  'ELECTRONICS',
  'FOOD_PROCESSING',
  'CHEMICALS',
  'PACKAGING',
  'FURNITURE',
  'MACHINERY',
  'CONSTRUCTION_MATERIALS',
  'PHARMACEUTICALS',
  'AGRICULTURAL',
  'LEATHER_GOODS',
  'PLASTICS',
  'METAL_FABRICATION',
  'OTHER',
] as const;

const UNIT_OPTIONS = ['units', 'kg', 'tons', 'litres', 'metres', 'pairs', 'boxes', 'sets'];

const COUNTRY_OPTIONS = [
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'GH', name: 'Ghana' },
  { code: 'EG', name: 'Egypt' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
];

// ─── Stepper ──────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Product',    number: 1 },
  { label: 'Quantities', number: 2 },
  { label: 'Delivery',   number: 3 },
  { label: 'Review',     number: 4 },
] as const;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, idx) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-body font-semibold border-2 transition-colors ${
                step.number < current
                  ? 'bg-success border-success text-success-foreground'
                  : step.number === current
                  ? 'bg-brand border-brand text-brand-foreground'
                  : 'bg-surface border-border text-foreground-subtle'
              }`}
            >
              {step.number < current ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.number
              )}
            </div>
            <span
              className={`mt-1.5 font-body text-xs ${
                step.number === current ? 'text-brand font-medium' : 'text-foreground-subtle'
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`w-12 sm:w-20 h-px mx-2 mb-5 transition-colors ${
                step.number < current ? 'bg-success' : 'bg-border'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  productCategory:  string;
  productName:      string;
  description:      string;
  quantityUnits:    string;
  unitOfMeasure:    string;
  targetUnitPrice:  string; // Display string in ZAR (e.g. "1500.00")
  deadline:         string; // ISO date string YYYY-MM-DD
  deliveryAddress:  string;
  deliveryCountry:  string;
  notes:            string;
}

const INITIAL_FORM: FormState = {
  productCategory:  '',
  productName:      '',
  description:      '',
  quantityUnits:    '',
  unitOfMeasure:    'units',
  targetUnitPrice:  '',
  deadline:         '',
  deliveryAddress:  '',
  deliveryCountry:  '',
  notes:            '',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewOrderPage() {
  const router  = useRouter();
  const { data: session } = useSession();

  const [step, setStep]         = useState(1);
  const [form, setForm]         = useState<FormState>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting]   = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  function setField(field: keyof FormState) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (fieldErrors[field]) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    };
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  function validateStep(s: number): Partial<Record<keyof FormState, string>> {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (s === 1) {
      if (!form.productCategory) errors.productCategory = 'Select a category';
      if (!form.productName.trim()) errors.productName = 'Product name is required';
    }
    if (s === 2) {
      const qty = Number(form.quantityUnits);
      if (!form.quantityUnits || isNaN(qty) || qty <= 0)
        errors.quantityUnits = 'Enter a valid quantity';
      const price = parseZarToCents(form.targetUnitPrice);
      if (!form.targetUnitPrice || price <= 0)
        errors.targetUnitPrice = 'Enter a valid price per unit (ZAR)';
      if (!form.deadline) errors.deadline = 'Select a delivery deadline';
    }
    if (s === 3) {
      if (!form.deliveryAddress.trim())
        errors.deliveryAddress = 'Delivery address is required';
      if (!form.deliveryCountry)
        errors.deliveryCountry = 'Select a delivery country';
    }
    return errors;
  }

  function handleNext() {
    const errors = validateStep(step);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setStep((s) => s + 1);
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!session?.accessToken) return;

    setSubmitting(true);
    setGlobalError(null);

    const targetUnitPriceCents = parseZarToCents(form.targetUnitPrice);
    const totalValue = targetUnitPriceCents * Number(form.quantityUnits);

    const dto: CreateOrderDto = {
      productCategory: form.productCategory,
      productName:     form.productName.trim(),
      specifications:  form.description ? { description: form.description } : {},
      quantityUnits:   Number(form.quantityUnits),
      unitOfMeasure:   form.unitOfMeasure,
      targetUnitPrice: targetUnitPriceCents,
      deadline:        new Date(form.deadline).toISOString(),
      deliveryAddress: form.deliveryAddress.trim(),
      deliveryCountry: form.deliveryCountry,
      notes:           form.notes.trim() || undefined,
    };

    try {
      const res = await fetch(
        `${process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1'}/orders`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            Authorization:   `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify(dto),
        },
      );

      const json = await res.json() as { success: boolean; data?: { id: string }; error?: { message: string } };

      if (!json.success || !json.data) {
        setGlobalError(json.error?.message ?? 'Failed to create order. Please try again.');
        return;
      }

      // Redirect to the new order detail page
      router.push(`/orders/${json.data.id}`);
    } catch {
      setGlobalError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Review summary ──────────────────────────────────────────────────────────

  const priceCents = parseZarToCents(form.targetUnitPrice);
  const qty        = Number(form.quantityUnits) || 0;
  const totalCents = priceCents * qty;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-foreground mb-1">
          PLACE NEW ORDER
        </h1>
        <p className="font-body text-sm text-foreground-muted">
          Tell us what you need — our AI engine will match you with the best
          African factories.
        </p>
      </div>

      <StepIndicator current={step} />

      {/* Global error */}
      {globalError !== null && (
        <div
          role="alert"
          className="px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm font-body"
        >
          {globalError}
        </div>
      )}

      <Card variant="elevated" padding="lg">
        {/* ── Step 1: Product ── */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl text-foreground">
              WHAT DO YOU NEED?
            </h2>

            <div>
              <label className="text-sm font-semibold font-body text-foreground-muted block mb-1.5">
                Product Category *
              </label>
              <select
                value={form.productCategory}
                onChange={setField('productCategory')}
                className="h-10 px-3 w-full font-body bg-surface border border-border rounded-lg text-foreground text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-background focus:border-brand"
              >
                <option value="">Select category…</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              {fieldErrors.productCategory && (
                <p className="mt-1 text-xs font-body text-danger">
                  {fieldErrors.productCategory}
                </p>
              )}
            </div>

            <Input
              label="Product Name *"
              placeholder="e.g. Organic Cotton T-Shirts"
              value={form.productName}
              onChange={setField('productName')}
              error={fieldErrors.productName}
            />

            <div>
              <label className="text-sm font-semibold font-body text-foreground-muted block mb-1.5">
                Description / Specifications (optional)
              </label>
              <textarea
                value={form.description}
                onChange={setField('description')}
                placeholder="Describe your product requirements, materials, dimensions, colours, tolerances…"
                rows={4}
                className="w-full px-3 py-2.5 font-body bg-surface border border-border rounded-lg text-foreground text-sm placeholder:text-foreground-subtle transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-background focus:border-brand resize-none"
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Quantities & Pricing ── */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl text-foreground">
              QUANTITIES &amp; PRICING
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Quantity *"
                placeholder="e.g. 5000"
                value={form.quantityUnits}
                onChange={setField('quantityUnits')}
                error={fieldErrors.quantityUnits}
                min={1}
              />

              <div>
                <label className="text-sm font-semibold font-body text-foreground-muted block mb-1.5">
                  Unit of Measure *
                </label>
                <select
                  value={form.unitOfMeasure}
                  onChange={setField('unitOfMeasure')}
                  className="h-10 px-3 w-full font-body bg-surface border border-border rounded-lg text-foreground text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-background focus:border-brand"
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              type="number"
              label="Target Price per Unit (ZAR) *"
              placeholder="e.g. 45.00"
              value={form.targetUnitPrice}
              onChange={setField('targetUnitPrice')}
              error={fieldErrors.targetUnitPrice}
              hint="Enter your target price per unit in South African Rand"
              min={0.01}
              step={0.01}
            />

            {priceCents > 0 && qty > 0 && (
              <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-brand/10 border border-brand/25">
                <span className="font-body text-sm text-foreground-muted">
                  Estimated Total Value
                </span>
                <span className="font-mono text-lg text-brand font-bold">
                  {formatZar(totalCents)}
                </span>
              </div>
            )}

            <Input
              type="date"
              label="Required Delivery Date *"
              value={form.deadline}
              onChange={setField('deadline')}
              error={fieldErrors.deadline}
              min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0]}
            />
          </div>
        )}

        {/* ── Step 3: Delivery ── */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl text-foreground">
              DELIVERY DETAILS
            </h2>

            <Input
              label="Delivery Address *"
              placeholder="Street address, city, postal code"
              value={form.deliveryAddress}
              onChange={setField('deliveryAddress')}
              error={fieldErrors.deliveryAddress}
            />

            <div>
              <label className="text-sm font-semibold font-body text-foreground-muted block mb-1.5">
                Delivery Country *
              </label>
              <select
                value={form.deliveryCountry}
                onChange={setField('deliveryCountry')}
                className="h-10 px-3 w-full font-body bg-surface border border-border rounded-lg text-foreground text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-background focus:border-brand"
              >
                <option value="">Select country…</option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.deliveryCountry && (
                <p className="mt-1 text-xs font-body text-danger">
                  {fieldErrors.deliveryCountry}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold font-body text-foreground-muted block mb-1.5">
                Additional Notes (optional)
              </label>
              <textarea
                value={form.notes}
                onChange={setField('notes')}
                placeholder="Any special delivery instructions, packaging requirements, etc."
                rows={3}
                className="w-full px-3 py-2.5 font-body bg-surface border border-border rounded-lg text-foreground text-sm placeholder:text-foreground-subtle transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-background focus:border-brand resize-none"
              />
            </div>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl text-foreground">
              REVIEW &amp; CONFIRM
            </h2>
            <p className="font-body text-sm text-foreground-muted">
              Review your order before submission. Once placed, the AI engine
              will begin factory matching.
            </p>

            <div className="space-y-3">
              {[
                { label: 'Category',        value: form.productCategory.replace(/_/g, ' ') },
                { label: 'Product',         value: form.productName },
                { label: 'Quantity',        value: `${form.quantityUnits} ${form.unitOfMeasure}` },
                { label: 'Price / Unit',    value: `ZAR ${form.targetUnitPrice}` },
                { label: 'Total Value',     value: formatZar(totalCents) },
                { label: 'Deadline',        value: form.deadline },
                { label: 'Delivery To',     value: form.deliveryCountry },
                { label: 'Address',         value: form.deliveryAddress },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-start justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="font-body text-xs text-foreground-subtle uppercase tracking-wide w-32 shrink-0">
                    {label}
                  </span>
                  <span className="font-body text-sm text-foreground text-right">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Escrow notice */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-info/10 border border-info/25 text-sm font-body text-foreground-muted">
              <span className="text-info text-base mt-0.5 shrink-0">ℹ</span>
              <p>
                Payment will be held in escrow and released to factories only
                after you confirm delivery. An 8% platform commission applies.
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
            >
              ← Back
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button variant="primary" onClick={handleNext}>
              Next →
            </Button>
          ) : (
            <Button
              variant="primary"
              loading={submitting}
              onClick={() => void handleSubmit()}
            >
              Place Order
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
