import { ChangeDetectionStrategy, Component, ContentChildren, ElementRef, QueryList, ViewChild } from '@angular/core';
import { map, mergeWith, Observable, startWith, Subject } from 'rxjs';

import { shareReplayLast } from '../../../../common/custom-operators';
import { WindowService } from '../../../../services/windows.service';
import { SliderItemDirective } from './slider-item.directive';

@Component({
    selector: 'app-slider',
    templateUrl: './slider.component.html',
    styleUrls: ['./slider.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SliderComponent {
    public showButtons$: Observable<boolean>;
    public refresh$ = new Subject<void>();

    private _items?: QueryList<ElementRef<HTMLDivElement>>;
    private _slider?: ElementRef<HTMLDivElement>;
    private slidesIndex = 0;

    public constructor(windowService: WindowService) {

        this.showButtons$ = this.refresh$.pipe(
            mergeWith(windowService.windowResized$),
            map(() => !!this.items?.length && !!this.slidesContainer && this.items.reduce((size, item) => size += item.nativeElement.clientWidth, 0) > this.slidesContainer.nativeElement.clientWidth),
            startWith(false),
            shareReplayLast()
        );
    }

    @ContentChildren(SliderItemDirective, { read: ElementRef, descendants: true })
    public set items(items: QueryList<ElementRef<HTMLDivElement>> | undefined) {
        this._items = items;
        this.refresh$.next();
    }

    public get items(): QueryList<ElementRef<HTMLDivElement>> | undefined {
        return this._items;
    }

    @ViewChild('slides')
    public set slidesContainer(slider: ElementRef<HTMLDivElement> | undefined) {
        this._slider = slider;
        this.refresh$.next();
    }

    public get slidesContainer(): ElementRef<HTMLDivElement> | undefined {
        return this._slider;
    }

    public get currentItem(): ElementRef<HTMLDivElement> | undefined {
        return this.items?.find((_, index) => index === this.slidesIndex);
    }

    public onClickLeft(): void {
        const currentItem = this.currentItem;
        if (!this.slidesContainer || !currentItem) {
            return;
        }

        this.slidesContainer.nativeElement.scrollLeft -= currentItem.nativeElement.offsetWidth;

        if (this.slidesIndex > 0) {
            this.slidesIndex--;
        }
    }

    public onClickRight(): void {
        const currentItem = this.currentItem;
        if (!this.slidesContainer || !this.items || !currentItem) {
            return;
        }

        this.slidesContainer.nativeElement.scrollLeft += currentItem.nativeElement.offsetWidth;

        if (this.slidesIndex < this.items.length - 1) {
            this.slidesIndex++;
        }
    }
}
