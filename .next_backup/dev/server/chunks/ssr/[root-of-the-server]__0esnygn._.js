module.exports = [
"[project]/src/app/actions/public.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40477342e2f3236b453ea2cd9c1adb2ea79322016b":{"name":"getPublicEventData"}},"src/app/actions/public.ts",""] */ __turbopack_context__.s([
    "getPublicEventData",
    ()=>getPublicEventData
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '@prisma/client'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
const prisma = new PrismaClient();
async function getPublicEventData(eventId) {
    try {
        // 1. Get Latest Results (Published only)
        const latestResults = await prisma.result.findMany({
            where: {
                program: {
                    eventId
                },
                isPublished: true
            },
            include: {
                candidate: {
                    include: {
                        team: true
                    }
                },
                program: true
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: 10
        });
        // 2. Get Teams with Leader Info
        const teams = await prisma.team.findMany({
            where: {
                eventId
            }
        });
        // 3. Get Published Results for Calculation
        const allPublishedResults = await prisma.result.findMany({
            where: {
                program: {
                    eventId
                },
                isPublished: true
            },
            include: {
                candidate: {
                    include: {
                        team: true,
                        category: true
                    }
                },
                program: {
                    include: {
                        category: true
                    }
                }
            }
        });
        // --- Team Leaderboard ---
        const teamScores = {};
        allPublishedResults.forEach((res)=>{
            const teamId = res.candidate.team.id;
            if (!teamScores[teamId]) {
                teamScores[teamId] = {
                    id: teamId,
                    name: res.candidate.team.name,
                    points: 0,
                    flagColor: res.candidate.team.flagColor
                };
            }
            teamScores[teamId].points += res.points;
        });
        const leaderboard = Object.values(teamScores).sort((a, b)=>b.points - a.points);
        // --- Individual Top 5 Stars (Overall) ---
        const candidateScores = {};
        allPublishedResults.forEach((res)=>{
            const candId = res.candidate.id;
            if (!candidateScores[candId]) {
                candidateScores[candId] = {
                    id: candId,
                    name: res.candidate.name,
                    teamName: res.candidate.team.name,
                    teamColor: res.candidate.team.flagColor,
                    categoryName: res.candidate.category.name,
                    points: 0
                };
            }
            candidateScores[candId].points += res.points;
        });
        const topStars = Object.values(candidateScores).sort((a, b)=>b.points - a.points).slice(0, 5);
        // --- Category Top 5 Stars ---
        const categories = await prisma.category.findMany({
            where: {
                eventId
            }
        });
        const categoryStars = {};
        categories.forEach((cat)=>{
            const catScores = Object.values(candidateScores).filter((c)=>c.categoryName === cat.name).sort((a, b)=>b.points - a.points).slice(0, 5);
            if (catScores.length > 0) {
                categoryStars[cat.name] = catScores;
            }
        });
        return {
            success: true,
            data: {
                latestResults,
                leaderboard,
                teams,
                topStars,
                categoryStars
            }
        };
    } catch (error) {
        console.error("Failed to fetch public data:", error);
        return {
            success: false,
            error: "Failed to fetch data"
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getPublicEventData
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getPublicEventData, "40477342e2f3236b453ea2cd9c1adb2ea79322016b", null);
}),
"[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/app/actions/public.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$public$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/actions/public.ts [app-rsc] (ecmascript)");
;
}),
"[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/app/actions/public.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "40477342e2f3236b453ea2cd9c1adb2ea79322016b",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$public$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPublicEventData"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$app$2f$actions$2f$public$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => "[project]/src/app/actions/public.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$public$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/actions/public.ts [app-rsc] (ecmascript)");
}),
"[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/* eslint-disable import/no-extraneous-dependencies */ Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "registerServerReference", {
    enumerable: true,
    get: function() {
        return _server.registerServerReference;
    }
});
const _server = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
}),
"[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// This function ensures that all the exported values are valid server actions,
// during the runtime. By definition all actions are required to be async
// functions, but here we can only check that they are functions.
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ensureServerEntryExports", {
    enumerable: true,
    get: function() {
        return ensureServerEntryExports;
    }
});
function ensureServerEntryExports(actions) {
    for(let i = 0; i < actions.length; i++){
        const action = actions[i];
        if (typeof action !== 'function') {
            throw Object.defineProperty(new Error(`A "use server" file can only export async functions, found ${typeof action}.\nRead more: https://nextjs.org/docs/messages/invalid-use-server-value`), "__NEXT_ERROR_CODE", {
                value: "E352",
                enumerable: false,
                configurable: true
            });
        }
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0esnygn._.js.map