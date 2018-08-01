
let _canvas: HTMLCanvasElement | null = null;

function canvasContext(): CanvasRenderingContext2D {
    if (_canvas === null)
        _canvas = document.createElement('canvas');
    
    const context = _canvas.getContext('2d');
    if (context === null)
        throw new Error('Unable to get canvas context');
    return context;
}

export function measureText(opts: { text: string, fontValue: string }): number {
    const context = canvasContext();
    context.font = opts.fontValue;
    return context.measureText(opts.text).width;
}
