import { Directive, ElementRef } from '@angular/core';
import { takeUntil } from 'rxjs';

import { WindowService } from '../../../../services/windows.service';
import { DestroyDirective } from '../../../destroy/destroy.directive';

export type GaugeStyles = 'circular' | 'horizontal' | 'vertical';

export interface GaugeColor {
    color?: string;
    min?: number;
    max?: number;
    h?: number;
    s?: number;
    l?: number;
    h1?: number;
    s1?: number;
    l1?: number;
    h2?: number;
    s2?: number;
    l2?: number;
    r?: number;
    g?: number;
    b?: number;
    a?: number;
    r1?: number;
    g1?: number;
    b1?: number;
    a1?: number;
    r2?: number;
    g2?: number;
    b2?: number;
    a2?: number;
}

export type StringFn = (val: number) => string;
export type NumberFn = (val: number) => number;
export type ColorTypes = string | StringFn | ReadonlyArray<GaugeColor>;
export type GaugeOptionsTypes = GaugeStyles | number | string | ColorTypes | ReadonlyArray<number> | boolean;

export abstract class GaugeOptions {
    [key: string]: GaugeOptionsTypes;
    public style: GaugeStyles = 'circular';
    public value = 0;
    public reference = 0;
    public valueLineWidth = 20;
    public refLineWidth = 0;
    public valueTextSize = 40;
    public refTextSize = 14;
    public refColor: ColorTypes = 'black';
    public valueColor: ColorTypes = 'black';
    public title = '';
    public titleTextSize = 14;
    public titleTextColor: ColorTypes = 'black';
    public limits: ReadonlyArray<number> = new Array<number>(); // Array of limits indicators
    public limitsColor = 'red';
    public error = false;
    public errorColor = 'red';
    public speed = 0.4;
}

@Directive()
export abstract class GaugeBase<T extends GaugeOptions> extends DestroyDirective {
    protected element: HTMLElement;
    private canvas?: HTMLCanvasElement;
    private requestAnimationId = 0;
    private animationLastTime = 0;
    private currentValue = 0;
    private currentRef = 0;

    protected abstract options: T;

    public constructor(
        protected el: ElementRef<HTMLElement>,
        protected windowService: WindowService
    ) {
        super();

        this.element = el.nativeElement;

        windowService.windowResized$.pipe(
            takeUntil(this.destroyed$)
        ).subscribe(() => this.refresh());
    }

    protected startAnimation(): void {
        if (!window.performance || !window.requestAnimationFrame) {
            this.currentValue = this.options.value;
            this.currentRef = this.options.reference;
        } else {
            this.stopAnimation();
            this.animationLastTime = window.performance.now();
            this.requestAnimationId = window.requestAnimationFrame(() => {
                this.animate();
            });

            if (!isNaN(this.options.value)) {
                this.currentValue = this.currentValue || 0;
            }
            if (!isNaN(this.options.reference)) {
                this.currentRef = this.currentRef || 0;
            }
        }
        this.draw();
    }

    protected stopAnimation(): void {
        if (this.requestAnimationId) {
            window.cancelAnimationFrame(this.requestAnimationId);
            this.requestAnimationId = 0;
        }
    }

    protected getColor(colorName: string, value: number): string {
        if (this.options.error && colorName !== 'backgroundColor') {
            return this.options.errorColor;
        }

        const clr = this.options[colorName] as (v: number) => string | ReadonlyArray<GaugeColor>;
        if (clr instanceof Array) {
            let color = clr as ReadonlyArray<GaugeColor>;
            color = color.filter(col => value >= (col.min || 0) && (!col.max || value < col.max));
            const range = color?.[0];
            const str = new Array<string>();

            if (range) {
                if (range.color) {
                    str.push(range.color);
                } else if (range.r !== undefined && range.g !== undefined && range.b !== undefined) {
                    str.push(range.a ? 'rgba(' : 'rgb(');
                    str.push(String(range.r));
                    str.push(',');
                    str.push(String(range.g));
                    str.push(',');
                    str.push(String(range.b));
                    if (range.a) {
                        str.push(',');
                        str.push(String(range.a));
                    }
                    str.push(')');
                } else if (range.h !== undefined && range.s !== undefined && range.l !== undefined) {
                    str.push(range.a ? 'hsla(' : 'hsl(');
                    str.push(String(range.h));
                    str.push(',');
                    str.push(String(range.s));
                    str.push('%,');
                    str.push(String(range.l));
                    str.push('%');
                    if (range.a) {
                        str.push(',');
                        str.push(String(range.a));
                    }
                    str.push(')');
                } else if (range.max !== undefined && range.h1 !== undefined && range.s1 !== undefined && range.l1 !== undefined && range.h2 !== undefined && range.s2 !== undefined && range.l2 !== undefined) {
                    const min = range.min || 0;
                    const f = (value - min) / (range.max - min);
                    const h = Math.round(range.h1 + f * (range.h2 - range.h1));
                    const s = Math.round(range.s1 + f * (range.s2 - range.s1));
                    const l = Math.round(range.l1 + f * (range.l2 - range.l1));
                    let a = 0;
                    if (range.a1 && range.a2) {
                        a = Math.round(range.a1 + f * (range.a2 - range.a1));
                    }
                    str.push(a ? 'hsla(' : 'hsl(');
                    str.push(String(h));
                    str.push(',');
                    str.push(String(s));
                    str.push('%,');
                    str.push(String(l));
                    str.push('%');
                    if (a) {
                        str.push(',');
                        str.push(String(a));
                    }
                    str.push(')');
                }
            }

            return (str.length && str.join('')) || String(color?.[0].color || color?.[0] || 'rgb(0,0,0)');
        } else if (typeof clr === 'function') {
            const fn = clr as (v: number) => string;
            return fn(value);
        }

        return clr;
    }

    protected getText(textName: string, value?: number): string {
        const text = this.options[textName] as StringFn | string;
        if (typeof text === 'function' && value !== undefined) {
            const val = text(value);
            if (val) {
                return val;
            }
        }

        return text?.toString() || (value !== undefined && !isNaN(value) ? `${Math.floor(value / 100 * 100)}%` : '');
    }

    protected animate(): void {
        const hasValue = this.options && !isNaN(this.options.value);
        const hasRef = this.options && !isNaN(this.options.reference);
        const now = window.performance.now();
        const diff = now - this.animationLastTime;

        // This will animate the gauge to new positions
        // clear animation loop if value reaches to newValue
        const valueMatch = !hasValue || Math.abs(this.currentValue - this.options.value) < 0.01;
        const refMatch = !hasRef || Math.abs(this.currentRef - this.options.reference) < 0.01;

        if (!hasValue) {
            this.currentValue = 0;
        } else if (valueMatch) {
            this.currentValue = this.options.value;
        } else if (this.options.value < this.currentValue) {
            this.currentValue -= diff / this.options.speed;
            if (this.currentValue < this.options.value) {
                this.currentValue = this.options.value;
            }
        } else {
            this.currentValue += diff / this.options.speed;
            if (this.currentValue > this.options.value) {
                this.currentValue = this.options.value;
            }
        }

        if (!hasRef) {
            this.currentRef = 0;
        } else if (refMatch) {
            this.currentRef = this.options.reference;
        } else if (this.options.reference < this.currentRef) {
            this.currentRef -= diff / this.options.speed;
            if (this.currentRef < this.options.reference) {
                this.currentRef = this.options.reference;
            }
        } else {
            this.currentRef += diff / this.options.speed;
            if (this.currentRef > this.options.reference) {
                this.currentRef = this.options.reference;
            }
        }

        this.draw();

        if (!valueMatch || !refMatch) {
            // Next frame
            this.animationLastTime = now;
            this.requestAnimationId = window.requestAnimationFrame(() => {
                this.animate();
            });
        }
    }

    private draw(): void {
        let halfLineWidth = 0;

        this.canvas = this.canvas || this.element.firstElementChild as HTMLCanvasElement;
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            console.error('Fail to create canvas');
            return;
        }

        // dimensions
        const width = this.canvas.width = this.element.clientWidth;
        const height = this.canvas.height = this.element.clientHeight;
        if (!width || !height) {
            return;
        }

        // Position function for horizontal layout
        let getPos: NumberFn | undefined;
        if (this.options.style !== 'circular') {
            getPos = (value: number): number => this.options.style === 'horizontal' ? halfLineWidth + (width - 2 * halfLineWidth) * value / 100 : height - (halfLineWidth + (height - 2 * halfLineWidth) * value / 100);
        }

        // Clear the canvas everytime a chart is drawn
        ctx.clearRect(0, 0, width, height);

        // Measure text's size
        const valueText = this.getText('valueText', this.currentValue);
        ctx.font = `${this.options.valueTextSize}px titilliumregular`;
        const valueTextWidth = valueText && ctx.measureText(valueText).width || 0;

        const titleText = this.getText('title');
        ctx.font = `${this.options.titleTextSize}px titilliumregular`;
        const titleTextWidth = titleText && ctx.measureText(titleText).width || 0;

        const refText = this.getText('refText', this.currentRef);
        ctx.font = `${this.options.refTextSize}px bebas`;
        const refTextWidth = refText && ctx.measureText(refText).width || 0;

        // Background
        let lineWidth = 0;
        ctx.beginPath();
        ctx.strokeStyle = this.getColor('backgroundColor', this.currentValue);
        switch (this.options.style) {
            case 'horizontal':
                // Background rounded line
                lineWidth = ctx.lineWidth = this.options.valueLineWidth;
                halfLineWidth = Math.ceil(lineWidth / 2);
                ctx.lineCap = 'round';
                ctx.moveTo(halfLineWidth, height - halfLineWidth);
                ctx.lineTo(width - halfLineWidth, height - halfLineWidth);
                break;

            case 'vertical':
                // Background rounded line
                lineWidth = ctx.lineWidth = this.options.valueLineWidth;
                halfLineWidth = Math.ceil(lineWidth / 2);
                ctx.lineCap = 'round';
                ctx.moveTo(halfLineWidth, halfLineWidth);
                ctx.lineTo(halfLineWidth, height - halfLineWidth);
                break;

            default:
                // Background 360 degree arc
                lineWidth = ctx.lineWidth = this.options.valueLineWidth + this.options.refLineWidth + 1;
                ctx.arc(width / 2, height / 2, (width - ctx.lineWidth) / 2, 0, Math.PI * 2, false);
                break;
        }
        ctx.stroke();

        const valueColor = this.getColor('valueColor', this.currentValue);
        const valuePos = getPos?.(this.currentValue) || 0;
        if (!isNaN(this.currentValue)) {
            ctx.beginPath();
            switch (this.options.style) {
                case 'horizontal':
                    ctx.fillStyle = valueColor;
                    ctx.arc(valuePos, height - halfLineWidth, halfLineWidth, 0, 2 * Math.PI, false);
                    ctx.fill();
                    break;

                case 'vertical':
                    ctx.fillStyle = valueColor;
                    ctx.arc(halfLineWidth, valuePos, halfLineWidth, 0, 2 * Math.PI, true);
                    ctx.fill();
                    break;

                default:
                    ctx.strokeStyle = valueColor;
                    // gauge will be a simple arc
                    // Angle in radians = angle in value * PI / 180
                    ctx.lineWidth = this.options.valueLineWidth;
                    // The arc starts from the rightmost end. If we deduct 90 value from the angles
                    // the arc will start from the topmost end
                    ctx.arc(width / 2, height / 2, (width - ctx.lineWidth) / 2, 0 - 90 * Math.PI / 180, this.currentValue * Math.PI / 50 - 90 * Math.PI / 180, false);
                    ctx.stroke();
                    break;
            }
        }

        // Lets add the valueText
        let valueTextPos = 0;
        if (valueText) {
            ctx.fillStyle = valueColor;
            ctx.font = `${this.options.valueTextSize}px titilliumregular`;

            switch (this.options.style) {
                case 'horizontal':
                    ctx.textBaseline = 'bottom';
                    valueTextPos = valueText && Math.min(Math.max(0, (valuePos || 0) - valueTextWidth / 2), width - valueTextWidth) || 0;
                    ctx.fillText(valueText, valueTextPos, height - lineWidth - 2);
                    break;

                case 'vertical':
                    ctx.textBaseline = 'middle';
                    valueTextPos = valueText && Math.min(Math.max(this.options.valueTextSize / 2, valuePos || 0), height - this.options.valueTextSize / 2) || 0;
                    ctx.fillText(valueText, lineWidth + 10, valueTextPos);
                    break;

                default:
                    ctx.textBaseline = 'middle';
                    ctx.fillText(valueText, width / 2 - valueTextWidth / 2, height / 2);
                    break;
            }
        }

        if (titleText) {
            ctx.fillStyle = this.getColor('titleTextColor', 0);
            ctx.font = `${this.options.titleTextSize}px titilliumregular`;
            switch (this.options.style) {
                case 'horizontal':
                    ctx.textBaseline = 'bottom';
                    ctx.fillText(titleText, width / 2 - titleTextWidth / 2, height - lineWidth - this.options.valueTextSize - 10);
                    break;

                case 'vertical':
                    if (!valueTextPos || valueTextPos - this.options.valueTextSize > 5) {
                        ctx.textBaseline = 'top';
                        ctx.fillText(titleText, lineWidth + 10, 5);
                    }
                    break;

                default:
                    ctx.textBaseline = 'bottom';
                    ctx.fillText(titleText, width / 2 - titleTextWidth / 2, (height - this.options.valueTextSize) / 2 - 10);
                    break;
            }
        }

        let refColor = '';
        const currentRef = this.currentRef;
        if (this.options.refLineWidth && currentRef !== undefined && !isNaN(currentRef)) {
            refColor = this.getColor('refColor', currentRef);
            ctx.beginPath();
            ctx.strokeStyle = refColor;
            const refLineWidth = ctx.lineWidth = this.options.refLineWidth;
            let x: number;
            let y: number;

            switch (this.options.style) {
                case 'horizontal':
                    ctx.lineCap = 'square';
                    x = getPos?.(currentRef) || 0;
                    ctx.moveTo(x, height - lineWidth + refLineWidth / 2);
                    ctx.lineTo(x, height - refLineWidth / 2);
                    break;

                case 'vertical':
                    ctx.lineCap = 'square';
                    y = getPos?.(this.currentRef) || 0;
                    ctx.moveTo(refLineWidth / 2, y);
                    ctx.lineTo(lineWidth - refLineWidth / 2, y);
                    break;

                default:
                    // Angle in radians = angle in value * PI / 180
                    // The arc starts from the rightmost end. If we deduct 90 value from the angles
                    // the arc will start from the topmost end
                    ctx.arc(width / 2, height / 2, (width - 2 * this.options.valueLineWidth - this.options.refLineWidth - 2) / 2, 0 - 90 * Math.PI / 180, this.currentRef * Math.PI / 50 - 90 * Math.PI / 180, false);
                    break;
            }
            ctx.stroke();
        }

        if (refText) {
            refColor ||= this.getColor('refColor', this.currentRef);
            ctx.beginPath();
            ctx.strokeStyle = refColor;
            ctx.font = `${this.options.refTextSize}px bebas`;

            switch (this.options.style) {
                case 'horizontal':
                    ctx.fillText(refText, width / 2 - refTextWidth / 2, height - this.options.titleTextSize - this.options.valueTextSize - this.options.refTextSize - 30);
                    break;

                case 'vertical':
                    ctx.fillText(refText, lineWidth + 10, height / 2 + this.options.valueTextSize);
                    break;

                default:
                    ctx.textBaseline = 'top';
                    ctx.fillText(refText, width / 2 - refTextWidth / 2, (height + this.options.valueTextSize) / 2 + 10);
                    break;
            }
            ctx.stroke();
        }

        if (this.options.limits && this.options.limitsColor !== null) {
            this.options.limits.forEach(limit => {
                ctx.beginPath();
                ctx.strokeStyle = this.options.limitsColor;
                let x: number;
                let y: number;

                switch (this.options.style) {
                    case 'horizontal':
                        ctx.lineWidth = 3;
                        ctx.lineCap = 'square';
                        x = getPos?.(limit) || 0;
                        ctx.moveTo(x, height - lineWidth + 2);
                        ctx.lineTo(x, height - 2);
                        break;

                    case 'vertical':
                        ctx.lineWidth = 3;
                        ctx.lineCap = 'square';
                        y = getPos?.(limit) || 0;
                        ctx.moveTo(2, y);
                        ctx.lineTo(lineWidth - 2, y);
                        break;

                    default:
                        ctx.lineWidth = this.options.valueLineWidth;
                        // Angle in radians = angle in value * PI / 180
                        // The arc starts from the rightmost end. If we deduct 90 value from the angles
                        // the arc will start from the topmost end
                        ctx.arc(width / 2, height / 2, (width - ctx.lineWidth) / 2, (limit - 1) * Math.PI / 50 - 90 * Math.PI / 180, limit * Math.PI / 50 - 90 * Math.PI / 180, false);
                        break;
                }
                ctx.stroke();
            });
        }
    }

    protected abstract refresh(): void;
}
