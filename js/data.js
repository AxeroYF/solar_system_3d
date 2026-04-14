import * as THREE from 'three';

export const atmosphereVertexShader = `
    varying vec3 vNormal;
    void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const atmosphereFragmentShader = `
    varying vec3 vNormal;
    uniform vec3 glowColor;
    uniform float coef;
    uniform float power;
    uniform float opacity;
    void main() {
        float intensity = pow(coef - dot(vNormal, vec3(0, 0, 1.0)), power);
        gl_FragColor = vec4(glowColor, 1.0) * intensity;
        gl_FragColor.a *= opacity;
    }
`;

export const J2000_DATE = new Date('2000-01-01T12:00:00Z');
export const MS_PER_DAY = 86400000;

const texBase = "https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets/images/";
const moonBase = "https://raw.githubusercontent.com/8ef/solar-system/master/img/";

function createCometTailTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.4, 'rgba(200, 220, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 256);
    return new THREE.CanvasTexture(canvas);
}

export const textures = {
    sun: texBase + 'sunmap.jpg',
    mercury: texBase + 'mercurymap.jpg',
    venus: texBase + 'venusmap.jpg',
    earth: texBase + 'earthmap1k.jpg',
    earthNormal: texBase + 'earthnormal1k.jpg',
    earthSpecular: texBase + 'earthspec1k.jpg',
    earthClouds: texBase + 'earthcloudmap.jpg',
    mars: texBase + 'marsmap1k.jpg',
    marsNormal: texBase + 'marsnormal1k.jpg',
    jupiter: texBase + 'jupitermap.jpg',
    saturn: texBase + 'saturnmap.jpg',
    saturnRing: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Solarsystemscope_texture_2k_saturn_ring.png/1024px-Solarsystemscope_texture_2k_saturn_ring.png',
    uranus: texBase + 'uranusmap.jpg',
    neptune: texBase + 'neptunemap.jpg',
    moon: texBase + 'moonmap1k.jpg',
    phobos: moonBase + 'phobos.jpg',
    deimos: moonBase + 'deimos.jpg',
    io: moonBase + 'io.jpg',
    europa: moonBase + 'europa.jpg',
    ganymede: moonBase + 'ganymede.jpg',
    callisto: moonBase + 'callisto.jpg',
    titan: moonBase + 'titan.jpg',
    triton: moonBase + 'triton.jpg',
    titania: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Titania_%28moon%29_color_cropped.jpg/800px-Titania_%28moon%29_color_cropped.jpg',
    pluto: texBase + 'plutomap1k.jpg',
    charon: texBase + 'moonmap1k.jpg',
    ceres: texBase + 'ceresmap.jpg',
    halley: texBase + 'moonmap1k.jpg',
    iss: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/International_Space_Station_after_undocking_of_STS-132.jpg/640px-International_Space_Station_after_undocking_of_STS-132.jpg',
    cometTail: createCometTailTexture()
};

export const planetData = [
    {
        name: "水星", color: 0xA5A5A5, radius: 3.8, distance: 60,
        eccentricity: 0.2056, inclination: 7.0, orbitalPeriod: 87.97, meanAnomalyJ2000: 174.79,
        speed: 0.04, rotateSpeed: 0.004, texture: textures.mercury,
        description: "水星是太阳系中最小的行星，也是最接近太阳的行星。它的表面布满陨石坑，看起来与月球非常相似。",
        details: { "平均直径": "4,880 km", "距离太阳": "0.39 AU", "公转周期": "88 天", "自转周期": "58.6 天", "表面温度": "-173°C 至 427°C", "卫星数量": "0" },
        link: "https://zh.wikipedia.org/wiki/%E6%B0%B4%E6%98%9F"
    },
    {
        name: "金星", color: 0xE3BB76, radius: 9.5, distance: 90,
        eccentricity: 0.0067, inclination: 3.39, orbitalPeriod: 224.70, meanAnomalyJ2000: 50.11,
        speed: 0.015, rotateSpeed: -0.002, texture: textures.venus,
        description: "金星是离太阳第二近的行星，也是夜空中亮度仅次于月球的天体。它拥有浓厚的大气层，温室效应导致表面温度极高。",
        details: { "平均直径": "12,104 km", "距离太阳": "0.72 AU", "公转周期": "224.7 天", "自转周期": "243 天 (逆行)", "表面温度": "~462°C", "卫星数量": "0" },
        link: "https://zh.wikipedia.org/wiki/%E9%87%91%E6%98%9F"
    },
    {
        name: "地球", color: 0x2233FF, radius: 10, distance: 130,
        eccentricity: 0.0167, inclination: 0.0, orbitalPeriod: 365.25, meanAnomalyJ2000: 357.52,
        speed: 0.01, rotateSpeed: 0.02, texture: textures.earth,
        description: "地球是我们居住的星球，也是目前已知唯一孕育生命的星球。71%的表面被水覆盖。",
        details: { "平均直径": "12,742 km", "距离太阳": "1.00 AU", "公转周期": "365.25 天", "自转周期": "23小时56分", "表面温度": "-88°C 至 58°C", "卫星数量": "1 (月球)" },
        link: "https://zh.wikipedia.org/wiki/%E5%9C%B0%E7%90%83",
        moons: [
            {
                name: "月球", color: 0x888888, radius: 2.7, distance: 20,
                speed: 0.05, orbitalPeriod: 27.32, inclination: 5.14, texture: textures.moon,
                description: "月球是地球唯一的天然卫星，也是太阳系第五大卫星。",
                details: { "平均直径": "3,474 km", "距地距离": "384,400 km", "轨道周期": "27.3 天" },
                link: "https://zh.wikipedia.org/wiki/%E6%9C%88%E7%90%83"
            },
            {
                name: "国际空间站", color: 0xDDDDDD, radius: 0.5, distance: 13,
                speed: 1.5, orbitalPeriod: 0.06458, inclination: 51.6, texture: null,
                realPhoto: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/The_station_pictured_from_the_SpaceX_Crew_Dragon_5_%28cropped%29.jpg/800px-The_station_pictured_from_the_SpaceX_Crew_Dragon_5_%28cropped%29.jpg",
                isSpacecraft: true,
                description: "国际空间站（ISS）是位于低地轨道的模块化空间站，是人类历史上最大的太空工程。",
                details: { "高度": "~400 km", "速度": "27,600 km/h", "轨道周期": "~93 分钟", "发射时间": "1998年" },
                link: "https://zh.wikipedia.org/wiki/%E5%9B%BD%E9%99%85%E7%A9%BA%E9%97%B4%E7%AB%99"
            }
        ]
    },
    {
        name: "火星", color: 0xDD4422, radius: 5.3, distance: 180,
        eccentricity: 0.0934, inclination: 1.85, orbitalPeriod: 686.98, meanAnomalyJ2000: 19.41,
        speed: 0.008, rotateSpeed: 0.018, texture: textures.mars,
        description: "火星被称为红色星球，其表面呈现红色的赤铁矿。它是人类未来星际移民的首选目标。",
        details: { "平均直径": "6,779 km", "距离太阳": "1.52 AU", "公转周期": "687 天", "自转周期": "24小时37分", "表面温度": "-143°C 至 35°C", "卫星数量": "2" },
        link: "https://zh.wikipedia.org/wiki/%E7%81%AB%E6%98%9F",
        moons: [
            {
                name: "火卫一", color: 0x887766, radius: 1.0, distance: 10,
                speed: 0.05 * (27.3 / 0.32), orbitalPeriod: 0.3189, inclination: 1.09, texture: textures.phobos,
                realPhoto: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Phobos_colour_2008.jpg/800px-Phobos_colour_2008.jpg",
                irregular: true, scale: [1.3, 1.0, 0.8],
                description: "火卫一（Phobos）是火星两颗卫星中较大的一颗。",
                details: { "英文名": "Phobos", "直径": "22.5 km", "轨道周期": "0.32 天" },
                link: "https://zh.wikipedia.org/wiki/%E7%81%AB%E5%8D%AB%E4%B8%80"
            },
            {
                name: "火卫二", color: 0x998877, radius: 0.6, distance: 16,
                speed: 0.05 * (27.3 / 1.26), orbitalPeriod: 1.262, inclination: 1.79, texture: textures.deimos,
                realPhoto: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Deimos-MRO.jpg/800px-Deimos-MRO.jpg",
                irregular: true, scale: [1.2, 1.0, 0.8],
                description: "火卫二（Deimos）是火星较小且较外侧的卫星。",
                details: { "英文名": "Deimos", "直径": "12.4 km", "轨道周期": "1.26 天" },
                link: "https://zh.wikipedia.org/wiki/%E7%81%AB%E5%8D%AB%E4%BA%8C"
            }
        ]
    },
    {
        name: "谷神星", color: 0x888888, radius: 1.0, distance: 220,
        eccentricity: 0.0758, inclination: 10.6, orbitalPeriod: 1681.6, meanAnomalyJ2000: 77.0,
        speed: 0.007, rotateSpeed: 0.05, texture: textures.ceres,
        realPhoto: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Ceres_-_RC3_-_Haulani_Crater_%2822381131691%29_%28cropped%29.jpg/800px-Ceres_-_RC3_-_Haulani_Crater_%2822381131691%29_%28cropped%29.jpg",
        description: "谷神星（Ceres）是火星和木星之间小行星带中唯一的矮行星。它是小行星带中最大的天体。",
        details: { "平均直径": "946 km", "距离太阳": "2.77 AU", "公转周期": "4.6 年", "自转周期": "9小时4分", "表面温度": "~-105°C", "分类": "矮行星" },
        link: "https://zh.wikipedia.org/wiki/%E8%B0%B7%E7%A5%9E%E6%98%9F"
    },
    {
        name: "木星", color: 0xD9A066, radius: 30, distance: 350,
        eccentricity: 0.0489, inclination: 1.3, orbitalPeriod: 4332.59, meanAnomalyJ2000: 20.02,
        speed: 0.004, rotateSpeed: 0.04, texture: textures.jupiter,
        description: "木星是太阳系最大的行星，是一颗气态巨行星。它拥有标志性的大红斑风暴和众多的卫星。",
        details: { "平均直径": "139,820 km", "距离太阳": "5.20 AU", "公转周期": "11.9 年", "自转周期": "9小时55分", "主要成分": "氢、氦", "卫星数量": "95+" },
        link: "https://zh.wikipedia.org/wiki/%E6%9C%A8%E6%98%9F",
        moons: [
            { name: "木卫一", color: 0xFFFF99, radius: 2.8, distance: 42, speed: 0.05 * (27.3 / 1.77), orbitalPeriod: 1.769, inclination: 0.05, texture: textures.io, realPhoto: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Io_highest_resolution_true_color.jpg/800px-Io_highest_resolution_true_color.jpg", description: "木卫一（Io）是太阳系中地质活动最活跃的天体，拥有400多座活火山。", details: { "英文名": "Io", "直径": "3,643 km", "轨道周期": "1.77 天" }, link: "https://zh.wikipedia.org/wiki/%E6%9C%A8%E5%8D%AB%E4%B8%80" },
            { name: "木卫二", color: 0xDDDDFF, radius: 2.5, distance: 56, speed: 0.05 * (27.3 / 3.55), orbitalPeriod: 3.551, inclination: 0.47, texture: textures.europa, realPhoto: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Europa-moon-with-margins.jpg/800px-Europa-moon-with-margins.jpg", description: "木卫二（Europa）表面覆盖着冰层，冰下可能存在液态海洋。", details: { "英文名": "Europa", "直径": "3,122 km", "轨道周期": "3.55 天" }, link: "https://zh.wikipedia.org/wiki/%E6%9C%A8%E5%8D%AB%E4%BA%8C" },
            { name: "木卫三", color: 0xAAAAAA, radius: 4.1, distance: 72, speed: 0.05 * (27.3 / 7.15), orbitalPeriod: 7.154, inclination: 0.20, texture: textures.ganymede, realPhoto: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Ganymede_-_Perijove_34_Composite.png/800px-Ganymede_-_Perijove_34_Composite.png", description: "木卫三（Ganymede）是太阳系最大的卫星，比水星还要大。", details: { "英文名": "Ganymede", "直径": "5,268 km", "轨道周期": "7.15 天" }, link: "https://zh.wikipedia.org/wiki/%E6%9C%A8%E5%8D%AB%E4%B8%89" },
            { name: "木卫四", color: 0x777777, radius: 3.8, distance: 90, speed: 0.05 * (27.3 / 16.69), orbitalPeriod: 16.689, inclination: 0.28, texture: textures.callisto, realPhoto: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Callisto.jpg/800px-Callisto.jpg", description: "木卫四（Callisto）是太阳系中表面陨石坑最多的天体之一。", details: { "英文名": "Callisto", "直径": "4,821 km", "轨道周期": "16.69 天" }, link: "https://zh.wikipedia.org/wiki/%E6%9C%A8%E5%8D%AB%E5%9B%9B" }
        ]
    },
    {
        name: "土星", color: 0xEEDDAA, radius: 25, distance: 550,
        eccentricity: 0.0565, inclination: 2.48, orbitalPeriod: 10759.22, meanAnomalyJ2000: 317.02,
        speed: 0.003, rotateSpeed: 0.038, texture: textures.saturn,
        hasRing: true, ringTexture: textures.saturnRing,
        description: "土星以其壮观的行星环系统而闻名，是太阳系第二大行星，也是密度最小的行星（小于水）。",
        details: { "平均直径": "116,460 km", "距离太阳": "9.58 AU", "公转周期": "29.5 年", "自转周期": "10小时33分", "主要成分": "氢、氦", "卫星数量": "146+" },
        link: "https://zh.wikipedia.org/wiki/%E5%9C%9F%E6%98%9F",
        moons: [
            { name: "土卫六", color: 0xFFCC33, radius: 4.0, distance: 60, speed: 0.05 * (27.3 / 15.95), orbitalPeriod: 15.945, inclination: 0.348, texture: textures.titan, realPhoto: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Titan_in_true_color.jpg/800px-Titan_in_true_color.jpg", description: "土卫六（Titan）是土星最大的卫星，也是太阳系唯一拥有浓厚大气层的卫星。", details: { "英文名": "Titan", "直径": "5,150 km", "轨道周期": "15.95 天" }, link: "https://zh.wikipedia.org/wiki/%E5%9C%9F%E5%8D%AB%E5%85%AD" }
        ]
    },
    {
        name: "天王星", color: 0xACE5EE, radius: 18, distance: 800,
        eccentricity: 0.0463, inclination: 0.77, orbitalPeriod: 30685.4, meanAnomalyJ2000: 142.59,
        speed: 0.002, rotateSpeed: 0.03, texture: textures.uranus,
        description: "天王星是一颗冰巨行星，它最独特的地方在于其自转轴几乎平躺在轨道面上。",
        details: { "平均直径": "50,724 km", "距离太阳": "19.2 AU", "公转周期": "84 年", "自转周期": "17小时14分", "表面温度": "~-197°C", "卫星数量": "27" },
        link: "https://zh.wikipedia.org/wiki/%E5%A4%A9%E7%8E%8B%E6%98%9F",
        moons: [
            { name: "天卫三", color: 0xDDDDDD, radius: 2.0, distance: 40, speed: 0.05 * (27.3 / 8.7), orbitalPeriod: 8.706, inclination: 0.34, texture: textures.titania, realPhoto: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Titania_%28moon%29_color_cropped.jpg/800px-Titania_%28moon%29_color_cropped.jpg", description: "天卫三（Titania）是天王星最大的卫星。", details: { "英文名": "Titania", "直径": "1,577 km", "轨道周期": "8.7 天" }, link: "https://zh.wikipedia.org/wiki/%E5%A4%A9%E5%8D%AB%E4%B8%89" }
        ]
    },
    {
        name: "海王星", color: 0x5566FF, radius: 17, distance: 1000,
        eccentricity: 0.0086, inclination: 1.77, orbitalPeriod: 60189.0, meanAnomalyJ2000: 260.25,
        speed: 0.001, rotateSpeed: 0.032, texture: textures.neptune,
        description: "海王星是太阳系已知最远的行星，是一颗深蓝色的冰巨行星，拥有太阳系最强烈的风暴。",
        details: { "平均直径": "49,244 km", "距离太阳": "30.1 AU", "公转周期": "164.8 年", "自转周期": "16小时6分", "表面温度": "~-201°C", "卫星数量": "14" },
        link: "https://zh.wikipedia.org/wiki/%E6%B5%B7%E7%8E%8B%E6%98%9F",
        moons: [
            { name: "海卫一", color: 0xAAAAFF, radius: 2.5, distance: 40, speed: -0.05 * (27.3 / 5.88), orbitalPeriod: 5.877, inclination: 156.885, texture: textures.triton, realPhoto: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Triton_moon_mosaic_Voyager_2_%28large%29.jpg/800px-Triton_moon_mosaic_Voyager_2_%28large%29.jpg", description: "海卫一（Triton）是海王星最大的卫星，也是太阳系唯一拥有逆行轨道的大卫星。", details: { "英文名": "Triton", "直径": "2,707 km", "轨道周期": "-5.88 天" }, link: "https://zh.wikipedia.org/wiki/%E6%B5%B7%E5%8D%AB%E4%B8%80" }
        ]
    },
    {
        name: "冥王星", color: 0xDDAA88, radius: 2.3, distance: 1250,
        eccentricity: 0.248, inclination: 17.16, orbitalPeriod: 90560.0, meanAnomalyJ2000: 14.88,
        speed: 0.0008, rotateSpeed: 0.005, texture: textures.pluto,
        description: "冥王星是柯伊伯带中最大的天体之一，曾被列为九大行星。它由岩石和冰组成，拥有一颗相对巨大的卫星——冥卫一。",
        details: { "平均直径": "2,377 km", "距离太阳": "39.5 AU", "公转周期": "248 年", "自转周期": "6.4 天", "表面温度": "~-229°C", "卫星数量": "5" },
        link: "https://zh.wikipedia.org/wiki/%E5%86%A5%E7%8E%8B%E6%98%9F",
        moons: [
            { name: "冥卫一", color: 0xCCCCCC, radius: 1.2, distance: 8, speed: 0.05 * (27.3 / 6.4), orbitalPeriod: 6.387, inclination: 0.0, texture: textures.charon, realPhoto: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Charon_in_True_Color_-_High-Res.jpg/800px-Charon_in_True_Color_-_High-Res.jpg", description: "冥卫一（Charon）是冥王星最大的卫星，与冥王星形成双矮行星系统。", details: { "英文名": "Charon", "直径": "1,212 km", "轨道周期": "6.4 天" }, link: "https://zh.wikipedia.org/wiki/%E5%86%A5%E5%8D%AB%E4%B8%80" }
        ]
    },
    {
        name: "哈雷彗星", color: 0xAAAAAA, radius: 1.5,
        distance: 470, eccentricity: 0.915, inclination: 162.26,
        orbitalPeriod: 27510, meanAnomalyJ2000: 66.4,
        speed: 0.01 / 76.0, rotateSpeed: 0.05, texture: textures.halley,
        realPhoto: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Lspn_comet_halley.jpg/800px-Lspn_comet_halley.jpg",
        irregular: true, scale: [1.5, 1.0, 0.8],
        description: "哈雷彗星是著名的短周期彗星，每隔75-76年就能从地球上用肉眼看到。它是唯一能用裸眼直接从地球看见的短周期彗星。",
        details: { "平均直径": "11 km", "近日点": "0.6 AU", "远日点": "35.1 AU", "轨道周期": "76.1 年", "离心率": "0.967" },
        link: "https://zh.wikipedia.org/wiki/%E5%93%88%E9%9B%B7%E5%BD%97%E6%98%9F"
    }
];

export const realScaleData = {
    "水星": { au: 0.39, radiusRatio: 0.38 },
    "金星": { au: 0.72, radiusRatio: 0.95 },
    "地球": { au: 1.00, radiusRatio: 1.00 },
    "火星": { au: 1.52, radiusRatio: 0.53 },
    "国际空间站": { au: 1.0005, radiusRatio: 0.01 },
    "谷神星": { au: 2.77, radiusRatio: 0.074 },
    "木星": { au: 5.20, radiusRatio: 11.2 },
    "土星": { au: 9.58, radiusRatio: 9.45 },
    "天王星": { au: 19.20, radiusRatio: 4.00 },
    "海王星": { au: 30.05, radiusRatio: 3.88 },
    "冥王星": { au: 39.48, radiusRatio: 0.18 },
    "哈雷彗星": { au: 17.8, radiusRatio: 0.05 }
};
