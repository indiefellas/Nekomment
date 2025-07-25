export enum TooltipPlacement {
    Top = 0b0000,
    Left = 0b0100,
    Bottom = 0b1000,
    Right = 0b1100,
}

export enum TooltipPlacementMask {
    Alignment = 0b0011,
    Position = 0b1100,
}