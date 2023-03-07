export interface Cell {
    id: string
    mode: 'code' | 'markdown'
    content: string
}

export interface ReplSource {
    cells: Cell[]
}
