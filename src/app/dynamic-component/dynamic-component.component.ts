import {
    AfterContentInit,
    AfterViewInit,
    Component,
    ContentChild,
    ElementRef,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';

@Component({
    selector: 'app-dynamic-component',
    templateUrl: './dynamic-component.component.html',
    styleUrls: ['./dynamic-component.component.scss'],
})
export class DynamicComponentComponent implements AfterViewInit {
    @ViewChild('reference', {read: ViewContainerRef}) viewContainerRef!: ViewContainerRef;
    @ViewChild('reference') elementRef!: ElementRef;

    ngAfterViewInit() {
        console.log(this.elementRef);
        console.log(this.viewContainerRef);
    }
}
