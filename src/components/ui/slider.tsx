import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  getAriaLabel,
  "aria-label": ariaLabel,
  getAriaValueText,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props & Pick<SliderPrimitive.Thumb.Props, "getAriaLabel" | "getAriaValueText">) {
  const _values = Array.isArray(value)
    ? value
    : typeof value === "number"
      ? [value]
      : Array.isArray(defaultValue)
        ? defaultValue
        : typeof defaultValue === "number"
          ? [defaultValue]
          : [min]

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-horizontal:min-h-6 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-muted select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            index={index}
            getAriaLabel={getAriaLabel ?? (() => ariaLabel ?? "Value")}
            getAriaValueText={getAriaValueText}
            className="relative block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

/**
 * Normalize what `onValueChange` hands back.
 *
 * The primitive reports a number for a single-thumb slider and an array for a
 * range. Every slider in the app is single-thumb and every call site reads its
 * value through this helper; `fallback` covers the empty-array case rather
 * than propagating `undefined` into volume, tempo, speed, or hue.
 */
function sliderValue(value: number | readonly number[], fallback = 0): number {
  return typeof value === "number" ? value : value[0] ?? fallback;
}

export { Slider, sliderValue }
