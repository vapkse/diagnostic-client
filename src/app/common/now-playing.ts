/* eslint-disable @typescript-eslint/naming-convention */

export interface NowPlayingResponse {
    artists: ReadonlyArray<string>;
    album?: string;
    title?: string;
    artistsInfos: Array<Artist>;
    errors: Array<Error>;
}

export interface Artist {
    idArtist: string;
    idLabel: string;
    intBornYear: string;
    intCharted: string;
    intDiedYear: string;
    intFormedYear: string;
    intMembers: string;
    strArtist: string;
    strArtistAlternate: string;
    strArtistBanner: string;
    strArtistClearart: string;
    strArtistFanart: string;
    strArtistFanart2: string;
    strArtistFanart3: string;
    strArtistFanart4: string;
    strArtistLogo: string;
    strArtistStripped: string;
    strArtistThumb: string;
    strArtistWideThumb: string;
    strBiography: string;
    strBiographyEN: string;
    strBiographyCN: string;
    strBiographyDE: string;
    strBiographyES: string;
    strBiographyFR: string;
    strBiographyHU: string;
    strBiographyIL: string;
    strBiographyIT: string;
    strBiographyJP: string;
    strBiographyNL: string;
    strBiographyNO: string;
    strBiographyPL: string;
    strBiographyPT: string;
    strBiographyRU: string;
    strBiographySE: string;
    strCountry: string;
    strCountryCode: string;
    strDisbanded: string;
    strFacebook: string;
    strGender: string;
    strGenre: string;
    strISNIcode: string;
    strLabel: string;
    strLastFMChart: string;
    strLocked: string;
    strMood: string;
    strMusicBrainzID: string;
    strStyle: string;
    strTwitter: string;
    strWebsite: string;
    strAudioDB: string;
    strMusicBrainz: string;
    error: string;
}
