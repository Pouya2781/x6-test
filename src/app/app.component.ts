import {
    AfterViewInit,
    ApplicationRef,
    ChangeDetectorRef,
    Component,
    ComponentFactoryResolver,
    ElementRef,
    Injector,
    Renderer2,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import {Cell, Edge, Graph, Markup, Model, Node, Timing} from '@antv/x6';
import {register} from '@antv/x6-angular-shape';
import {AccountType, CustomNodeComponent, NodeState} from './custom-node/custom-node.component';
import {CustomNodeService} from './services/custom-node.service';
import {BankGraph} from './models/bank-graph';
import {Selection} from '@antv/x6-plugin-selection';
import {ComponentPortal, DomPortalOutlet} from '@angular/cdk/portal';
import {ComponentCreatorService} from './services/component-creator.service';
import {Snapline} from '@antv/x6-plugin-snapline';
import {CustomEdge, CustomGraphService} from './services/custom-graph.service';
import {CustomEdgeLabelComponent, TransactionType} from './custom-edge-label/custom-edge-label.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
    private graph!: BankGraph;
    @ViewChild('.copppppp') conRef!: ElementRef;
    constructor(
        private injector: Injector,
        private customNodeService: CustomNodeService,
        private customGraphService: CustomGraphService,
        private renderer: Renderer2
    ) {
        this.customNodeService.nodeListener.subscribe((value) => {
            const targetNode = this.graph.getNode(value.nodeId);

            targetNode?.resize(value.width, value.height);
        });
    }
    ngAfterViewInit() {
        this.graph = new BankGraph({
            preventDefaultMouseDown: false,
            container: document.getElementById('container') as HTMLElement,
            background: {
                color: '#F2F7FA',
            },
            grid: true,
        });
        this.customGraphService.init(this.graph, this.renderer);

        this.graph.use(
            new Selection({
                enabled: true,
                multiple: true,
                rubberband: true,
                movable: true,
                // showNodeSelectionBox: true,
            })
        );

        this.graph.use(
            new Snapline({
                enabled: true,
            })
        );

        register({
            shape: 'custom-angular-component-node',
            content: CustomNodeComponent,
            injector: this.injector,
        });
        let node1 = this.customGraphService.addCustomNode({
            shape: 'custom-angular-component-node',
            x: 100,
            y: 100,
            data: {
                ngArguments: {
                    ownerName: 'افسر',
                    ownerFamilyName: 'طباطبایی',
                    accountID: '6534454617',
                    branchName: 'گلوبندک',
                    branchAddress: 'تهران-خیابان خیام-بالاتر از چهارراه گلوبندک',
                    branchTelephone: '55638667',
                    sheba: 'IR120778801496000000198',
                    cardID: '6104335000000190',
                    accountType: AccountType.SAVINGS,
                    transactionCount: 196,
                },
            },
        });
        const targetNodes: Node<Node.Properties>[] = [];
        for (let i = 0; i < 12; i++) {
            targetNodes.push(
                this.customGraphService.addCustomNode({
                    shape: 'custom-angular-component-node',
                    data: {
                        //Input parameters must be placed here
                        ngArguments: {
                            ownerName: 'شیرین',
                            ownerFamilyName: 'ابراهیم نژاد',
                            accountID: '6039548046',
                            branchName: 'خواجه عبدالله انصاری',
                            branchAddress: 'تهران-خیابان خواجه عبدالله انصاری-نبش کوچه ششم-پلاک 110',
                            branchTelephone: '22844370',
                            sheba: 'IR500379357299000000405',
                            cardID: '6395995000000400',
                            accountType: AccountType.CURRENT,
                            transactionCount: 8,
                        },
                    },
                })
            );
        }
        let node2 = this.customGraphService.addCustomNode({
            shape: 'custom-angular-component-node',
            x: 250,
            y: 250,
            data: {
                ngArguments: {
                    ownerName: 'شیرین',
                    ownerFamilyName: 'ابراهیم نژاد',
                    accountID: '6039548046',
                    branchName: 'خواجه عبدالله انصاری',
                    branchAddress: 'تهران-خیابان خواجه عبدالله انصاری-نبش کوچه ششم-پلاک 110',
                    branchTelephone: '22844370',
                    sheba: 'IR500379357299000000405',
                    cardID: '6395995000000400',
                    accountType: AccountType.CURRENT,
                    transactionCount: 8,
                },
            },
        });
        this.customGraphService.registerCustomLabel('data-label', CustomNodeComponent);
        this.customGraphService.registerCustomLabel('transaction-label', CustomEdgeLabelComponent);
        const edge2 = this.customGraphService.addCustomEdge({
            shape: 'edge',
            source: node1,
            target: node2,
            router: {
                name: 'manhattan',
                args: {
                    side: 'right',
                },
            },
            connector: {
                name: 'jumpover',
                args: {
                    type: 'arc',
                    size: 5,
                },
            },
            labelShape: 'transaction-label',
            label: {
                position: 0.5,
            },
            attrs: {
                line: {
                    stroke: '#ccc',
                },
            },
            ngArguments: {
                sourceAccount: '6534454617',
                destinationAccount: '6039548046',
                amount: '500000000',
                date: new Date('1399/04/23'),
                transactionID: '153348811341',
                transactionType: TransactionType.PAYA,
            },
        });
        // node1.zIndex = 1000;
        // node2.zIndex = 1000;

        setTimeout(() => {
            this.customGraphService.layout(270, 80, 40, targetNodes, true, 20);
        }, 5000);
    }
}
