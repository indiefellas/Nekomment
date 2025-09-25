
export enum PostBehavior {
    AutoPublish = 0,
    HoldForReview = 1,
}

export enum AutoModType {
    KeywordList = 0,
    Regex = 1,
    Internal = 2,
}

export enum AutoModInternalType {
    DetectSpam = 0,
    DetectVpnProxyTor = 1,
    DetectProfanity = 2
}

export enum AutoModBehavior {
    Block = 0,
    HoldForReview = 1,
}

export enum AutoModScopeType {
    Host = 0,
    Path = 1
}

export enum Permissions {
    // All accounts with host access will have this permission
    ReadWriteComments = 1 << 0,
    // Delete comments from that specific host
    DeleteComments = 1 << 1,
    // Block and unblock user's IPs.
    BlockUsers = 1 << 2,
    // Create and edit Auto Moderation rules
    CreateAutoModRules = 1 << 3,
    // Create and edit Nekomment Pages
    CreatePages = 1 << 4,
    // Edit host config. Think about this as the Administrator permission.
    // Note that host owner is the only one that can delete the specific host.
    EditHostConfig = 1 << 5
}