// Debug helper pro statistiky brankářů v2
export const debugGoalieStats = (matchState, tournamentState) => {
  console.log('=== DEBUG v2: Statistiky brankářů ===');
  console.log('Match state:', {
    events: matchState.events?.length,
    playerStats: matchState.playerStats,
    homeShots: matchState.homeShots,
    awayShots: matchState.awayShots
  });
  console.log('Tournament state:', {
    goalies: tournamentState.goalies?.map(g => ({
      name: g.name,
      team: g.team,
      saves: g.saves,
      shots: g.shots
    }))
  });
}; 