/* eslint-disable @typescript-eslint/naming-convention */
export const serialBufferMaxLength = 64;

export interface AmpStep {
    label: string;
    isError?: boolean;
}

export const AmpSteps = new Map<number, AmpStep>();
AmpSteps.set(0, { label: 'Stand-by' } as AmpStep);
AmpSteps.set(1, { label: 'Pre-stand-by' } as AmpStep);
AmpSteps.set(2, { label: 'Discharge' } as AmpStep);
AmpSteps.set(3, { label: 'Heating' } as AmpStep);
AmpSteps.set(4, { label: 'Starting High Voltage' } as AmpStep);
AmpSteps.set(5, { label: 'Regulating' } as AmpStep);
AmpSteps.set(6, { label: 'Normal Function' } as AmpStep);
AmpSteps.set(7, { label: 'Error', isError: true } as AmpStep);
AmpSteps.set(10, { label: 'Regulating driver' } as AmpStep);
AmpSteps.set(11, { label: 'Starting finales' } as AmpStep);
AmpSteps.set(12, { label: 'Regulating finales' } as AmpStep);
AmpSteps.set(13, { label: 'Normal Function' } as AmpStep);
AmpSteps.set(14, { label: 'Error', isError: true } as AmpStep);

// REQUEST params
export const AmpParamsRequest = new Map<string, number>();
AmpParamsRequest.set('reset', 70);
AmpParamsRequest.set('stop', 71);
AmpParamsRequest.set('writeParams', 80);
AmpParamsRequest.set('resetParams', 81);
AmpParamsRequest.set('resetModulation', 90);
AmpParamsRequest.set('getData', 100);
AmpParamsRequest.set('params', 110);
AmpParamsRequest.set('getParams', 111);
AmpParamsRequest.set('workingPoint', 112);
AmpParamsRequest.set('tempMeasureInterval', 114);
AmpParamsRequest.set('dischargeMaxTime', 115);
AmpParamsRequest.set('heatMaxTime', 116);
AmpParamsRequest.set('highVoltageMaxTime', 117);
AmpParamsRequest.set('regulationMaxTime', 118);
AmpParamsRequest.set('outOfRangeMaxTime', 119);
AmpParamsRequest.set('errorMaxTime', 120);
AmpParamsRequest.set('regulatedMinTime', 121);
AmpParamsRequest.set('highVoltageErrorMaxTime', 122);
AmpParamsRequest.set('emergencyStopDelay', 123);
AmpParamsRequest.set('startP', 124);
AmpParamsRequest.set('startMasterP', 124);
AmpParamsRequest.set('startI', 125);
AmpParamsRequest.set('startMasterI', 125);
AmpParamsRequest.set('startSlaveP', 126);
AmpParamsRequest.set('startSlaveI', 127);
AmpParamsRequest.set('regulationP', 128);
AmpParamsRequest.set('regulationMasterP', 128);
AmpParamsRequest.set('regulationI', 129);
AmpParamsRequest.set('regulationMasterI', 129);
AmpParamsRequest.set('regulationSlaveP', 130);
AmpParamsRequest.set('regulationSlaveI', 131);
AmpParamsRequest.set('functionP', 132);
AmpParamsRequest.set('functionMasterP', 132);
AmpParamsRequest.set('functionI', 133);
AmpParamsRequest.set('functionMasterI', 133);
AmpParamsRequest.set('functionSlaveP', 134);
AmpParamsRequest.set('functionSlaveI', 135);
AmpParamsRequest.set('regulationTreshold', 137);
AmpParamsRequest.set('startingTreshold', 138);
AmpParamsRequest.set('functionTreshold', 139);
AmpParamsRequest.set('measureAverageRatio', 140);
AmpParamsRequest.set('modulationPeakAverageRatio', 141);
AmpParamsRequest.set('modulationPeakReductionFactor', 142);
AmpParamsRequest.set('modulationDetectedMinTime', 143);
AmpParamsRequest.set('startWorkingPoint', 144);
AmpParamsRequest.set('minPoint', 145);
AmpParamsRequest.set('maxPoint', 146);
AmpParamsRequest.set('tempAirMax', 147);
AmpParamsRequest.set('tempRegulatorMax', 148);
AmpParamsRequest.set('tempAverageRatio', 149);
AmpParamsRequest.set('tempAirOffset', 150);
AmpParamsRequest.set('tempAirFactor', 151);
AmpParamsRequest.set('tempRegulatorOffset', 152);
AmpParamsRequest.set('tempRegulatorFactor', 153);
AmpParamsRequest.set('modulationLimit25', 154);
AmpParamsRequest.set('modulationLimit50', 155);
AmpParamsRequest.set('modulationLimit75', 156);
AmpParamsRequest.set('modulationLimit100', 157);
AmpParamsRequest.set('modulationCompensationFactor', 158);
AmpParamsRequest.set('minWorkingPoint', 159);
AmpParamsRequest.set('maxWorkingPoint', 160);
AmpParamsRequest.set('modulationPeakReductionTime', 162);
AmpParamsRequest.set('buttonPressedStandByTime', 163);
AmpParamsRequest.set('buttonPressedMinTime', 164);
AmpParamsRequest.set('buttonPressedModeTime', 165);
AmpParamsRequest.set('buttonPressedMaxTime', 166); // Deprecated
AmpParamsRequest.set('indicatorDetectModeMaxTime', 167);
AmpParamsRequest.set('indicatorDisplayModeMaxTime', 168);
AmpParamsRequest.set('indicatorMeasureFactor', 169);
AmpParamsRequest.set('indicatorPercentFactor', 170);
AmpParamsRequest.set('preStandByMaxTime', 171);
AmpParamsRequest.set('dischargeMinTime', 172);
AmpParamsRequest.set('autoWriteEepromDelay', 173);
AmpParamsRequest.set('phaseDetectionErrorMaxTime', 174);
AmpParamsRequest.set('buttonPressedResetTime', 175);
AmpParamsRequest.set('phaseDetectionErrorMaxCount', 177);
AmpParamsRequest.set('driverWorkingPoint', 178);
AmpParamsRequest.set('indicatorDampingFactor', 179);
AmpParamsRequest.set('heatMinTime', 180);
AmpParamsRequest.set('paramsFlags', 199);
AmpParamsRequest.set('controlsFlags', 201);
AmpParamsRequest.set('driverMeasureAverageRatio', 140);
AmpParamsRequest.set('finaleMeasureAverageRatio', 210);
AmpParamsRequest.set('driverMinPoint', 145);
AmpParamsRequest.set('finaleMinPoint', 211);
AmpParamsRequest.set('driverMaxPoint', 146);
AmpParamsRequest.set('finaleMaxPoint', 212);
// Already defined -> driverWorkingPoint: workingPoint,
AmpParamsRequest.set('finaleWorkingPoint', 213);
AmpParamsRequest.set('driverStartingTreshold', 138);
AmpParamsRequest.set('finaleStartingTreshold', 214);
AmpParamsRequest.set('driverFunctionTreshold', 139);
AmpParamsRequest.set('finaleFunctionTreshold', 215);
AmpParamsRequest.set('driverRegulationMaxTime', 118);
AmpParamsRequest.set('finaleRegulationMaxTime', 216);
AmpParamsRequest.set('driverRegulatedMinTime', 121);
AmpParamsRequest.set('finaleRegulatedMinTime', 217);
AmpParamsRequest.set('finaleStartP', 218);
AmpParamsRequest.set('finaleStartI', 219);
AmpParamsRequest.set('finaleStartD', 220);
AmpParamsRequest.set('finaleRegulationP', 221);
AmpParamsRequest.set('finaleRegulationI', 222);
AmpParamsRequest.set('finaleRegulationD', 223);
AmpParamsRequest.set('finaleFunctionP', 224);
AmpParamsRequest.set('finaleFunctionI', 225);
AmpParamsRequest.set('driverRegulationP', 226);
AmpParamsRequest.set('driverRegulationI', 227);
AmpParamsRequest.set('driverFunctionP', 228);
AmpParamsRequest.set('driverFunctionI', 229);
AmpParamsRequest.set('driverRegulationTreshold', 137);
AmpParamsRequest.set('finaleRegulationTreshold', 230);
AmpParamsRequest.set('driverStartWorkingPoint', 144);
AmpParamsRequest.set('driverStartWorkingPoint1', 144);
AmpParamsRequest.set('driverStartWorkingPoint2', 231);
AmpParamsRequest.set('finaleStartWorkingPoint', 232);
AmpParamsRequest.set('driverOutOfRangeMaxTime', 119);
AmpParamsRequest.set('finaleOutOfRangeMaxTime', 233);
AmpParamsRequest.set('driverRegulationD', 234);
AmpParamsRequest.set('startD', 235);
AmpParamsRequest.set('regulationD', 236);

export interface AmpError {
    descr: string;
}

export const AmpErrors = new Map<number, AmpError>();
AmpErrors.set(2, { descr: 'Discharge too long' } as AmpError);
AmpErrors.set(3, { descr: 'Current during heat time' } as AmpError);
AmpErrors.set(4, { descr: 'Regulation too long' } as AmpError);
AmpErrors.set(5, { descr: 'Maximun current reached during regulation' } as AmpError);
AmpErrors.set(6, { descr: 'Minimum current reached during regulation' } as AmpError);
AmpErrors.set(7, { descr: 'Maximun reached during normal function' } as AmpError);
AmpErrors.set(8, { descr: 'Minimum reached during normal function' } as AmpError);
AmpErrors.set(9, { descr: 'Time elapsed with current out of range during normal function' } as AmpError);
AmpErrors.set(10, { descr: 'Starting too long' } as AmpError);
AmpErrors.set(11, { descr: 'Out of range during starting' } as AmpError);
AmpErrors.set(12, { descr: 'Temperature maximum reached' } as AmpError);
AmpErrors.set(13, { descr: 'Phase detection error' } as AmpError);
AmpErrors.set(14, { descr: 'External stop' } as AmpError);
AmpErrors.set(15, { descr: 'Minimun current reached' } as AmpError);
AmpErrors.set(16, { descr: 'Maximun current reached' } as AmpError);
AmpErrors.set(17, { descr: 'High voltage present during heat' } as AmpError);
AmpErrors.set(50, { descr: 'Offline.' } as AmpError);
AmpErrors.set(51, { descr: 'Time out.' } as AmpError);
AmpErrors.set(52, { descr: 'Unknown request.' } as AmpError);
AmpErrors.set(53, { descr: 'Error writing params.' } as AmpError);
AmpErrors.set(55, { descr: 'Working point canot be set in auto mode.' } as AmpError);
AmpErrors.set(56, { descr: 'Global request return different values from cards.' } as AmpError);
AmpErrors.set(57, { descr: 'Busy.' } as AmpError);

export interface Tubeinfo {
    name: string;
    valueFactor?: number;
    valueOffset?: number;
    valueUnit?: string;
    refFactor?: number;
    refOffset?: number;
    min?: number;
    max?: number;
    ref?: number;
}

export interface ModulationInfo {
    dataValueName: string;
    dataValueIndex: number;
    factor?: number;
}

export interface ToggleInfo {
    flag: number;
    flagName: string;
    title: string;
}

export interface Toggle extends ToggleInfo {
    name: string;
}

export interface SliderInfo {
    title: string;
    min?: number;
    max?: number;
    step?: number;
    factor?: number;
}

export interface Slider extends SliderInfo {
    name: string;
    enabled?: boolean;
}

export interface FieldInfo {
    type: string;
    name: string;
    title?: string;
    fields?: ReadonlyArray<FieldInfo>;
    slider?: SliderInfo;
    toggles?: ReadonlyArray<ToggleInfo>;
    index?: number;
}

export interface TempSensorInfo {
    name: string;
    offset?: number;
    factor?: number;
    index?: number;
}

export interface AmpError {
    descr: string;
}

export interface StepInfo extends AmpStep {
    labelColor?: string;
    range: number;
}

export interface AmpInfoPicture {
    description?: string;
    path: string;
    width?: string;
}

export interface AmpInfoSchematic {
    description?: string;
    path: string;
    width?: string;
}

export interface AmpInfoMeasure {
    description?: string;
    path: string;
    width?: string;
}

export type ControlPanelTypes = 'reset' | 'resetModulation' | 'stop';

export interface AmpInfoInterface {
    name?: string;
    id?: number;
    description?: string;
    dampingfactor?: number;
    power?: string;
    bandwidth?: string;
    amplificationfactor?: number;
    inverter?: boolean;
    tubes?: ReadonlyArray<Tubeinfo>;
    url?: string;
    valueFactor?: number;
    valueOffset?: number;
    valueUnit?: string;
    refFactor?: number;
    refOffset?: number;
    outputLimits?: ReadonlyArray<number>;
    dataInfos?: ReadonlyArray<FieldInfo>;
    modulationInfos?: ModulationInfo;
    steps?: ReadonlyArray<StepInfo>;
    visible?: boolean;
    controlsInfos?: ReadonlyArray<FieldInfo>;
    paramsInfos?: ReadonlyArray<FieldInfo>;
    paramsPanelTitle?: string;
    master?: number;
    inherits?: number;
    baseSection?: boolean;
    isMaster?: boolean;
    order?: number;
    modFactor?: number;
    picturesPath?: string;
    pictures?: ReadonlyArray<AmpInfoPicture>;
    schematicsPath?: string;
    schematics?: ReadonlyArray<AmpInfoSchematic>;
    measuresPath?: string;
    measures?: ReadonlyArray<AmpInfoMeasure>;
    controlsPanel?: ReadonlyArray<ControlPanelTypes>;
}

export class AmpInfo implements AmpInfoInterface {
    private values: AmpInfoInterface;
    private _stepMap: Map<number, StepInfo> = undefined as never;
    private _controlsSet: Set<ControlPanelTypes> = undefined as never;

    public constructor(values: AmpInfoInterface) {
        this.values = values;
    }

    public get name(): string | undefined {
        return this.values?.name;
    }

    public get id(): number | undefined {
        return this.values?.id;
    }

    public get description(): string | undefined {
        return this.values?.description;
    }

    public get dampingfactor(): number | undefined {
        return this.values?.dampingfactor;
    }

    public get power(): string | undefined {
        return this.values?.power;
    }

    public get bandwidth(): string | undefined {
        return this.values?.bandwidth;
    }

    public get amplificationfactor(): number | undefined {
        return this.values?.amplificationfactor;
    }

    public get inverter(): boolean | undefined {
        return this.values?.inverter;
    }

    public get tubes(): ReadonlyArray<Tubeinfo> | undefined {
        return this.values?.tubes;
    }

    public get url(): string | undefined {
        return this.values?.url;
    }

    public get valueFactor(): number | undefined {
        return this.values?.valueFactor;
    }

    public get valueOffset(): number | undefined {
        return this.values?.valueOffset;
    }

    public get valueUnit(): string | undefined {
        return this.values?.valueUnit;
    }

    public get refFactor(): number | undefined {
        return this.values?.refFactor;
    }

    public get refOffset(): number | undefined {
        return this.values?.refOffset;
    }

    public get outputLimits(): ReadonlyArray<number> | undefined {
        return this.values?.outputLimits;
    }

    public get dataInfos(): ReadonlyArray<FieldInfo> | undefined {
        return this.values?.dataInfos;
    }

    public get modulationInfos(): ModulationInfo | undefined {
        return this.values?.modulationInfos;
    }

    public get visible(): boolean | undefined {
        return this.values?.visible;
    }

    public get paramsInfos(): ReadonlyArray<FieldInfo> | undefined {
        return this.values?.paramsInfos;
    }

    public get paramsPanelTitle(): string | undefined {
        return this.values?.paramsPanelTitle;
    }

    public get master(): number | undefined {
        return this.values?.master;
    }

    public get inherits(): number | undefined {
        return this.values?.inherits;
    }

    public get baseSection(): boolean | undefined {
        return this.values?.baseSection;
    }

    public get order(): number | undefined {
        return this.values?.order;
    }

    public get modFactor(): number | undefined {
        return this.values?.modFactor;
    }

    public get picturesPath(): string | undefined {
        return this.values?.picturesPath;
    }

    public get pictures(): ReadonlyArray<AmpInfoPicture> | undefined {
        return this.values?.pictures;
    }

    public get schematicsPath(): string | undefined {
        return this.values?.schematicsPath;
    }

    public get schematics(): ReadonlyArray<AmpInfoSchematic> | undefined {
        return this.values?.schematics;
    }

    public get measuresPath(): string | undefined {
        return this.values?.measuresPath;
    }

    public get measures(): ReadonlyArray<AmpInfoMeasure> | undefined {
        return this.values?.measures;
    }

    public get controlsPanel(): ReadonlyArray<ControlPanelTypes> | undefined {
        return this.values?.controlsPanel;
    }

    public get isMaster(): boolean | undefined {
        return this.values?.isMaster;
    }

    public set isMaster(value: boolean | undefined) {
        if (!this.values) {
            return;
        }

        this.values.isMaster = value;
    }

    public get stepMap(): Map<number, StepInfo> {
        if (this._stepMap) {
            return this._stepMap;
        }

        if (!this.values?.steps) {
            this._stepMap = new Map<number, StepInfo>();
        } else {
            this._stepMap = this.values.steps.reduce((m, step, index) => m.set(index, step || {} as StepInfo), new Map<number, StepInfo>());
        }

        // Merge steps with default
        this._stepMap.forEach((step, key) => {
            const defaultStep = AmpSteps.get(key);
            if (defaultStep) {
                Object.keys(defaultStep)
                    .map(k => k as keyof AmpStep)
                    .filter(k => step[k] === undefined)
                    .forEach(k => {
                        step[k] = defaultStep[k] as never;
                    });
            }
        });

        return this._stepMap;
    }

    public get controlsSet(): Set<ControlPanelTypes> {
        if (this._controlsSet) {
            return this._controlsSet;
        }

        this._controlsSet = new Set<ControlPanelTypes>();

        if (this.values.controlsPanel) {
            this._controlsSet = this.values.controlsPanel.reduce((s, control) => s.add(control), this._controlsSet);
        }

        return this._controlsSet;
    }

    public merge(baseInfos: AmpInfo): void {
        const val = this.values;
        const base = baseInfos.values;

        Object.keys(base)
            .map(key => key as keyof AmpInfoInterface)
            .filter(key => val[key] === undefined)
            .forEach(key => {
                val[key] = base[key] as never;
            });

        this._stepMap = undefined as never;
    }
}

export interface AmpIndexedValue {
    [index: string]: number;
}

export interface AmpRequest {
    id: number;
    msg: number;
    value: number;
}

export interface AmpResponse {
    id: number;
    msg: number;
    errorNumber: number;
    extraValue: number;
}

export interface AmpRequestResponse {
    id: number;
    msg: number;
    port: string;
    error?: string;
    datas?: AmpDataHeader;
    nextTime: number;
}

export interface AmpDataHeader extends AmpResponse {
    step: number;
    steptmax: number;
    steptelaps: number;
    stepvmax: number;
    stepval: number;
    tick: number;
    // Client fields
    ctrlflags?: number;
    temp?: AmpIndexedValue;
    val?: AmpIndexedValue;
    out?: AmpIndexedValue;
    min?: number | AmpIndexedValue;
    max?: number | AmpIndexedValue;
    ref?: number | AmpIndexedValue;
    modlimits?: AmpIndexedValue;
}

export interface AmpStatus {
    id: number;
    status: number;
    statusText: string;
    step: number;
    lastseen: number;
    interval?: string;
    port: string;
    master: number;
    inherits: number;
    flags?: boolean; // Indicate if working point is manual or differential feedback is off
}

export const AmpParamsFlags = {
    workingPointAuto: 0x1,
    diffFeedBack: 0x2,
    default: 0x1
};

export const AmpControlsFlags = {
    diffFeedBack: 0x2,
    default: 0x2
};
