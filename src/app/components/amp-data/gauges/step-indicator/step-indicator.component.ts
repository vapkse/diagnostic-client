import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChange } from '@angular/core';

import { StepInfo } from '../../../../common/amp';

type StepIndicatorOptionsValues = 'valueLineColor' | 'timeLineColor' | 'labelColor' | 'stepSeparatorColor' | 'backgroundColor' | 'labelTextSize' | 'progressSize' | 'speed' | 'steps' | 'stepMaxTime' | 'stepElapsedTime' | 'stepMaxValue' | 'stepValue' | 'stepIndex';
type StepIndicatorStepValues = 'maxTime' | 'maxValue' | 'valueLineColor' | 'timeLineColor' | 'stepSeparatorColor' | 'backgroundColor' | 'label' | 'labelColor' | 'range' | 'isError';

export interface StepindicatorStep extends StepInfo {
    maxTime?: number;
    maxValue?: number;
    valueLineColor?: string;
    timeLineColor?: string;
    stepSeparatorColor?: string;
    backgroundColor?: string;
}

export class StepindicatorOptions {
    public valueLineColor = '#fff';
    public timeLineColor = 'hsla(195, 100%, 69%, 0.5)';
    public labelColor = '#eee';
    public stepSeparatorColor = '#888';
    public backgroundColor = '#222';
    public labelTextSize = 14;
    public progressSize = 40;
    public speed = 0.1;
    public steps = new Map<number, StepindicatorStep>();
    public stepMaxTime = 0;
    public stepElapsedTime = 0;
    public stepMaxValue = 0;
    public stepValue = 0;
    public stepIndex = 0;
}

// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
    selector: 'step-indicator',
    template: '<canvas class="step-indicator"></canvas>'
})
export class StepIndicatorComponent implements OnChanges, OnInit {
    @Input() public value = 0;
    @Input() public maxValue = 0;
    @Input() public elapsedTime = 0;
    @Input() public maxTime = 0;
    @Input() public stepIndex = 0;
    @Input() public steps = new Map<number, StepInfo>();
    @Input() public error?: string;
    private canvas?: HTMLCanvasElement;
    private options = new StepindicatorOptions();
    private element: HTMLElement;
    private requestAnimationId = 0;
    private animationLastTime = 0;
    private totalPercentTime = 0;
    private totalPercentValue = 0;
    private currentPercentValue = 0;
    private currentPercentTime = 0;
    private valueKey = 'value';
    private maxValueKey = 'maxValue';
    private maxTimeKey = 'maxTime';
    private elapsedTimeKey = 'elapsedTime';
    private stepIndexKey = 'stepIndex';

    public constructor(public el: ElementRef<HTMLElement>) {
        this.element = el.nativeElement;
    }

    public refresh(): void {
        this.options.steps = this.steps;

        // Current step object
        const currentStep = this.options.stepIndex >= 0 && this.options.steps.get(this.options.stepIndex);
        if (currentStep) {
            if (currentStep.isError) {
                currentStep.label = this.error || 'error';
            }

            // Calc previous steps percent
            let i = this.options.stepIndex;
            let previousPercent = 0;
            // eslint-disable-next-line no-loops/no-loops
            while (--i >= 0) {
                previousPercent += this.options.steps.has(i) && this.options.steps.get(i)?.range || 0;
            }

            // Calc value progress in total percent
            this.totalPercentValue = previousPercent;
            if (this.options.stepMaxValue && this.options.stepValue && currentStep.range) {
                this.totalPercentValue += this.options.stepValue * currentStep.range / this.options.stepMaxValue;
            }

            // Calc time progress in percent
            this.totalPercentTime = previousPercent;
            if (this.options.stepMaxTime && this.options.stepElapsedTime && currentStep.range) {
                this.totalPercentTime += this.options.stepElapsedTime * currentStep.range / this.options.stepMaxTime;
            }

            const step = this.options.steps.get(this.options.stepIndex);
            if (step) {
                step.maxTime = this.options.stepMaxTime;
                step.maxValue = this.options.stepMaxValue;
            }
        }

        this.startAnimation();
    }

    public ngOnChanges(changes: { [propertyName: string]: SimpleChange }): void {

        if (changes[this.valueKey]) {
            this.options.stepValue = changes[this.valueKey].currentValue as number;
        }
        if (changes[this.maxValueKey]) {
            this.options.stepMaxValue = changes[this.maxValueKey].currentValue as number;
        }
        if (changes[this.elapsedTimeKey]) {
            this.options.stepElapsedTime = changes[this.elapsedTimeKey].currentValue as number;
        }
        if (changes[this.maxTimeKey]) {
            this.options.stepMaxTime = changes[this.maxTimeKey].currentValue as number;
        }
        if (changes[this.stepIndexKey]) {
            this.options.stepIndex = changes[this.stepIndexKey].currentValue as number;
        }
        this.refresh();
    }

    public ngOnInit(): void {
        this.options.stepValue = this.value;
        this.options.stepMaxValue = this.maxValue;
        this.options.stepElapsedTime = this.elapsedTime;
        this.options.stepMaxTime = this.maxTime;
        this.options.stepIndex = this.stepIndex;
        this.refresh();
    }

    protected getColor(colorName: string, value?: number): string {
        const currentStep = this.stepIndex >= 0 && this.options.steps.get(this.stepIndex);
        const color = currentStep?.[colorName as StepIndicatorStepValues] as string || this.options[colorName as StepIndicatorOptionsValues] as string;

        if (typeof color === 'function' && value !== undefined) {
            const fn = color as (v: number) => string;
            return fn(value);
        }
        return color;
    }

    protected startAnimation(): void {
        if (!window.performance || !window.requestAnimationFrame) {
            this.currentPercentValue = this.totalPercentValue;
            this.currentPercentTime = this.totalPercentTime;
        } else {
            this.stopAnimation();
            this.animationLastTime = window.performance.now();
            this.requestAnimationId = window.requestAnimationFrame(() => {
                this.animate();
            });
        }
        this.draw();
    }

    protected stopAnimation(): void {
        if (this.requestAnimationId) {
            window.cancelAnimationFrame(this.requestAnimationId);
            this.requestAnimationId = 0;
        }
    }

    protected draw(): void {
        let previousPercent = 0;

        this.canvas = this.canvas || this.element.firstElementChild as HTMLCanvasElement;
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            console.error('Fail to create canvas');
            return;
        }

        // dimensions
        const width = this.canvas.width = this.element.clientWidth;
        const height = this.canvas.height = this.element.clientHeight;

        // Clear the canvas
        ctx.clearRect(0, 0, width, height);

        let currentStep = this.options.stepIndex >= 0 && this.options.steps.get(this.options.stepIndex);
        if (!currentStep) {
            return;
        }

        if (currentStep.range !== 0) {
            // Calc current step from the value percentage
            const stepMax = Array.from(this.options.steps).reduce((max, [id]) => Math.max(id, max), -1);
            let ii = -1;
            // eslint-disable-next-line no-loops/no-loops
            while (++ii < stepMax) {
                const step = this.options.steps.get(ii);
                if (step && step.range > 0) {
                    if (this.currentPercentValue >= previousPercent && this.currentPercentValue < previousPercent + step.range) {
                        currentStep = step;
                        break;
                    }
                    previousPercent += step.range;
                }
            }

            // Ensure that the current time is on the same step
            if (this.currentPercentTime <= previousPercent) {
                this.currentPercentTime = previousPercent;
            } else if (currentStep && this.currentPercentTime > previousPercent + currentStep.range) {
                this.currentPercentTime = previousPercent = previousPercent + currentStep.range;
            }
        }

        // Measure texts
        const textSize = this.options.labelTextSize;
        const progressSize = this.options.progressSize / 2;

        // Draw status text
        if (currentStep.label) {
            ctx.fillStyle = this.getColor('labelColor');
            ctx.font = `${textSize}px titilliumregular`;
            ctx.fillText(currentStep.label, progressSize / 2, textSize);
        }

        // Draw elapsed time text
        let label = '';
        if (currentStep.maxTime) {
            // Calc elapsed time from percent
            const p = (this.currentPercentTime - previousPercent) / currentStep.range;
            const elapsedTime = this.numeral(p * currentStep.maxTime);
            const maxTime = this.numeral(currentStep.maxTime);
            label += `elapsed:${this.format(elapsedTime)}/${this.format(maxTime)}s`;
        }

        // Draw value target
        if (currentStep.maxValue) {
            const targetPct = this.numeral((this.currentPercentValue - previousPercent) * 100 / currentStep.range);
            label += `         target:${this.format(targetPct)}%`;
        }

        if (label.length > 0) {
            const textWidth = ctx.measureText(label).width;
            ctx.fillStyle = this.getColor('labelColor');
            ctx.font = `${textSize}px titilliumregular`;
            ctx.fillText(label, width - progressSize / 2 - textWidth, textSize);
        }

        let top = textSize ? textSize + 2 : 0;
        if (currentStep.range > 0) {
            const spos = {
                x: progressSize / 2,
                y: top + this.options.progressSize / 2
            };

            const epos = {
                x: width - progressSize / 2,
                y: spos.y
            };

            // Background rounded line
            ctx.beginPath();
            ctx.strokeStyle = this.getColor('backgroundColor');
            ctx.lineWidth = progressSize;
            ctx.lineCap = 'round';
            ctx.moveTo(spos.x, spos.y);
            ctx.lineTo(epos.x, epos.y);
            ctx.stroke();

            // Draw target progression
            if (this.currentPercentValue) {
                ctx.beginPath();
                ctx.strokeStyle = this.getColor('valueLineColor');
                ctx.lineWidth = progressSize;
                ctx.lineCap = 'round';
                ctx.moveTo(spos.x, spos.y);
                ctx.lineTo(spos.x + this.currentPercentValue * (epos.x - spos.x) / 100, epos.y);
                ctx.stroke();
            }

            // Calc time progression length
            if (this.currentPercentTime) {
                // Draw time progression
                ctx.beginPath();
                ctx.strokeStyle = this.getColor('timeLineColor');
                ctx.lineWidth = progressSize;
                ctx.lineCap = 'round';
                ctx.moveTo(spos.x, spos.y);
                ctx.lineTo(spos.x + this.currentPercentTime * (epos.x - spos.x) / 100, epos.y);
                ctx.stroke();
            }

            // Draw the steps
            let totalRange = 0;
            top += this.options.progressSize / 4;
            this.options.steps.forEach(step => {
                if (step.range > 0) {
                    totalRange += step.range;
                    if (totalRange < 100) {
                        const left = spos.x + totalRange * (epos.x - spos.x) / 100;
                        ctx.beginPath();
                        ctx.strokeStyle = this.getColor('stepSeparatorColor');
                        ctx.lineWidth = 1;
                        ctx.lineCap = 'square';
                        ctx.moveTo(left, top);
                        ctx.lineTo(left, top + progressSize);
                        ctx.stroke();
                    }
                }
            });
        }
    }

    protected animate(): void {
        const valueMatch = Math.abs(this.currentPercentValue - this.totalPercentValue) < 0.01;
        const timeMatch = Math.abs(this.currentPercentTime - this.totalPercentTime) < 0.01;
        const now = window.performance.now();
        if ((valueMatch && timeMatch) || this.totalPercentValue < this.currentPercentValue - 20 || this.totalPercentTime < this.currentPercentTime - 20) {
            // Go down faster in case of restart or changing step
            this.currentPercentValue = this.totalPercentValue;
            this.currentPercentTime = this.totalPercentTime;
        } else {
            const diff = now - this.animationLastTime;

            if (valueMatch) {
                this.currentPercentValue = this.totalPercentValue;
            } else if (this.totalPercentValue < this.currentPercentValue) {
                this.currentPercentValue -= diff / this.options.speed;
                if (this.currentPercentValue < this.totalPercentValue) {
                    this.currentPercentValue = this.totalPercentValue;
                }
            } else {
                this.currentPercentValue += diff / this.options.speed;
                if (this.currentPercentValue > this.totalPercentValue) {
                    this.currentPercentValue = this.totalPercentValue;
                }
            }

            if (timeMatch) {
                this.currentPercentTime = this.totalPercentTime;
            } else if (this.totalPercentTime < this.currentPercentTime) {
                this.currentPercentTime -= diff / this.options.speed;
                if (this.currentPercentTime < this.totalPercentTime) {
                    this.currentPercentTime = this.totalPercentTime;
                }
            } else {
                this.currentPercentTime += diff / this.options.speed;
                if (this.currentPercentTime > this.totalPercentTime) {
                    this.currentPercentTime = this.totalPercentTime;
                }
            }
        }

        this.draw();

        if (!valueMatch || !timeMatch) {
            // Next frame
            this.animationLastTime = now;
            this.requestAnimationId = window.requestAnimationFrame(() => {
                this.animate();
            });
        }
    }

    private numeral(value: number): number {
        return value;
    }

    private format(value: number): string {
        return String(Math.round(value * 10) / 10);
    }
}
