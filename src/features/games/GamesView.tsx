import { memo, useState, useMemo, useCallback } from 'react'
import { useGame } from '@/hooks/useGame'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { audio } from '@/services/AudioService'
import { formatNumber } from '@/utils/format'
import type { FishType } from '@/types/game'
import { SnakeGame } from './SnakeGame'
import { MemoryGame } from './MemoryGame'
import { ReactionGame } from './ReactionGame'
import { RunnerGame } from './RunnerGame'
import { FishingGame } from './FishingGame'
import { BattleGame } from './BattleGame'
import { Puzzle2048 } from './puzzle2048/Puzzle2048'
import { SpinGame } from './SpinGame'
import { BossRaidGame } from './BossRaidGame'
import { DiceGame } from './DiceGame'
import { SpeedMathGame } from './SpeedMathGame'
import { WhackMoleGame } from './WhackMoleGame'
import { QuizGame } from './QuizGame'
import { ArenaGame } from './ArenaGame'
import { DungeonGame } from './DungeonGame'
import { BubblePopGame } from './BubblePopGame'
import { WordScrambleGame } from './WordScrambleGame'
import { ColorMatchGame } from './ColorMatchGame'
import { TypeRacerGame } from './TypeRacerGame'
import { NumberMemoryGame } from './NumberMemoryGame'
import { EmojiPatternGame } from './EmojiPatternGame'
import { TrueOrFalseGame } from './TrueOrFalseGame'
import { GridTapGame } from './GridTapGame'
import { MathSequenceGame } from './MathSequenceGame'
import { HangmanGame } from './HangmanGame'
import { SimonSaysGame } from './SimonSaysGame'
import { SpeedSortGame } from './SpeedSortGame'
import { HigherLowerGame } from './HigherLowerGame'
import { WordleGame } from './WordleGame'
import { CardWarGame } from './CardWarGame'
import { TriviaBlitzGame } from './TriviaBlitzGame'
import { CatchFrenzyGame } from './CatchFrenzyGame'
import { MinesweeperGame } from './MinesweeperGame'
import { RhythmTapGame } from './RhythmTapGame'
import { SudokuGame } from './SudokuGame'
import { PetRaceGame } from './PetRaceGame'
import { TowerDefenseGame } from './TowerDefenseGame'
import { SlotMachineGame } from './SlotMachineGame'
import { PinballGame } from './PinballGame'
import { TypingSpeedGame } from './TypingSpeedGame'
import { BrickBreakerGame } from './BrickBreakerGame'
import { SlidingPuzzleGame } from './SlidingPuzzleGame'
import { FlappyPetGame } from './FlappyPetGame'
import { ColorSortGame } from './ColorSortGame'
import { SpaceShooterGame } from './SpaceShooterGame'
import { DodgeBallGame } from './DodgeBallGame'
import { NumberCrunchGame } from './NumberCrunchGame'
import { TapRushGame } from './TapRushGame'
import { AnagramGame } from './AnagramGame'
import { PairMatchGame } from './PairMatchGame'
import { LightningMathGame } from './LightningMathGame'
import { EmojiGuesserGame } from './EmojiGuesserGame'
import { WordChainGame } from './WordChainGame'
import { StealthGame } from './StealthGame'
import { TicTacToeGame } from './TicTacToeGame'
import { MastermindGame } from './MastermindGame'
import { ConnectFourGame } from './ConnectFourGame'
import { RockPaperScissorsGame } from './RockPaperScissorsGame'
import { PongGame } from './PongGame'
import { BlackjackGame } from './BlackjackGame'
import { FlagQuizGame } from './FlagQuizGame'
import { BalanceBallGame } from './BalanceBallGame'
import { WordSearchGame } from './WordSearchGame'
import { SpeedTapGame } from './SpeedTapGame'
import { GemSwapGame } from './GemSwapGame'
import { TypingDuelGame } from './TypingDuelGame'
import { CatchFruitGame } from './CatchFruitGame'
import { CountdownGame } from './CountdownGame'
import { BubbleShooterGame } from './BubbleShooterGame'
import { LightsOutGame } from './LightsOutGame'
import { OddOneOutGame } from './OddOneOutGame'
import { ReflexColorGame } from './ReflexColorGame'
import { MathDuelGame } from './MathDuelGame'
import { TreasureHuntGame } from './TreasureHuntGame'
import { ShadowMatchGame } from './ShadowMatchGame'
import { StackTowerGame } from './StackTowerGame'
import { PuzzlePairsGame } from './PuzzlePairsGame'
import { EmojiCodeGame } from './EmojiCodeGame'
import { PatternRepeatGame } from './PatternRepeatGame'
import { TargetClickGame } from './TargetClickGame'
import { WordBombGame } from './WordBombGame'
import { NumberLineGame } from './NumberLineGame'
import { PressMeterGame } from './PressMeterGame'
import { SumFlashGame } from './SumFlashGame'
import { DartsGame } from './DartsGame'
import { LetterChaosGame } from './LetterChaosGame'
import { FactFictionGame } from './FactFictionGame'
import { GridRememberGame } from './GridRememberGame'
import { QuickSumGame } from './QuickSumGame'
import { AnimalSoundGame } from './AnimalSoundGame'
import { ColorMixGame2 } from './ColorMixGame2'
import { SnapCardGame } from './SnapCardGame'
import { SpellingGame } from './SpellingGame'
import { BubbleMathGame } from './BubbleMathGame'
import { PathfinderGame } from './PathfinderGame'
import { TypingRainGame } from './TypingRainGame'
import { ColorSequenceGame } from './ColorSequenceGame'
import { SpeedCountGame } from './SpeedCountGame'
import { MemoryFlipGame } from './MemoryFlipGame'
import { MirrorDrawGame } from './MirrorDrawGame'
import { TruthOrDareGame } from './TruthOrDareGame'
import { BeatBuilderGame } from './BeatBuilderGame'
import { WordGuesserGame } from './WordGuesserGame'
import { NumberPuzzleGame } from './NumberPuzzleGame'
import { TileMatchGame } from './TileMatchGame'
import { DirectionGame } from './DirectionGame'
import { BalloonSortGame } from './BalloonSortGame'
import { MathMazeGame } from './MathMazeGame'
import { GridFloodGame } from './GridFloodGame'
import { EmojiFindGame } from './EmojiFindGame'
import { MathBlindGame } from './MathBlindGame'
import { ColorFlashGame } from './ColorFlashGame'
import { ChameleonGame } from './ChameleonGame'
import { MultiplyRaceGame } from './MultiplyRaceGame'
import { SwapSortGame } from './SwapSortGame'
import { FractionGame } from './FractionGame'
import { StopClockGame } from './StopClockGame'
import { WordSnapGame } from './WordSnapGame'
import { NumBubbleGame } from './NumBubbleGame'
import { HoldFoldGame } from './HoldFoldGame'
import { CatchBallGame } from './CatchBallGame'
import { MathPathGame } from './MathPathGame'
import { PatternMatrixGame } from './PatternMatrixGame'
import { ZapGridGame } from './ZapGridGame'
import { CapitalsGame } from './CapitalsGame'
import { TypeCatchGame } from './TypeCatchGame'
import { MathGridGame } from './MathGridGame'
import { WordFlowGame } from './WordFlowGame'
import { ColorBlindGame } from './ColorBlindGame'
import { MemoryChainGame } from './MemoryChainGame'
import { SpeedCountdownGame } from './SpeedCountdownGame'
import { EmojiHuntGame } from './EmojiHuntGame'
import { TapTargetGame } from './TapTargetGame'
import { NumberSortGame } from './NumberSortGame'
import { MathBlitzGame } from './MathBlitzGame'
import { LetterDropGame } from './LetterDropGame'
import { ColorWordGame } from './ColorWordGame'
import { SpeedTypingGame } from './SpeedTypingGame'
import { BalloonPopGame } from './BalloonPopGame'
import { QuickFireGame } from './QuickFireGame'
import { PingPongGame } from './PingPongGame'
import { WordUnscrambleGame } from './WordUnscrambleGame'
import { DigitMemoGame } from './DigitMemoGame'
import { EmojiStoryGame } from './EmojiStoryGame'
import { NeonDodgeGame } from './NeonDodgeGame'
import { CurrencyQuizGame } from './CurrencyQuizGame'
import { MultiTapGame } from './MultiTapGame'
import { SpellingBeeGame } from './SpellingBeeGame'

type GameId = 'snake' | 'memory' | 'reaction' | 'runner' | 'fishing' | 'battle' | 'puzzle2048' | 'spin' | 'bossraid' | 'dice' | 'speedmath' | 'whack' | 'quiz' | 'arena' | 'dungeon' | 'bubble' | 'word' | 'color' | 'typer' | 'nummem' | 'emoji' | 'tof' | 'grid' | 'mathseq' | 'hangman' | 'simon' | 'sort' | 'hl' | 'wordle' | 'war' | 'trivia' | 'catch' | 'minesweeper' | 'rhythm' | 'sudoku' | 'race' | 'tower' | 'slots' | 'pinball' | 'typing' | 'bricks' | 'slide' | 'flappy' | 'csort' | 'shooter' | 'dodge' | 'numcrunch' | 'taprush' | 'anagram' | 'pairmatch' | 'lmath' | 'eguess' | 'wchain' | 'stealth' | 'ttt' | 'mastermind' | 'c4' | 'rps' | 'pong' | 'blackjack' | 'flagquiz' | 'balance' | 'wordsearch' | 'speedtap' | 'gemswap' | 'typeduel' | 'catchfruit' | 'countdown' | 'bubshoot' | 'lights' | 'oddout' | 'reflexcolor' | 'mathduel' | 'treasure' | 'shadowmatch' | 'stacktower' | 'ppairs' | 'emojicode' | 'patternrep' | 'targetclick' | 'wordbomb' | 'numline' | 'pressmeter' | 'sumflash' | 'darts' | 'letterchaos' | 'factfiction' | 'gridremem' | 'quicksum' | 'animalsound' | 'colormix2' | 'snapcard' | 'spellingg' | 'bubblemath' | 'pathfinder' | 'typingrain' | 'colorseq' | 'speedcount' | 'memflip' | 'mirrordraw' | 'truthdare' | 'beatbuilder' | 'wordguess' | 'numpuzzle' | 'tilematch' | 'direction' | 'balloons' | 'mathmaze' | 'gridflood' | 'emojifind' | 'mathblind' | 'colorflash' | 'chameleon' | 'multiplyrace' | 'swapsort' | 'fraction' | 'stopclock' | 'wordsnap' | 'numbubble' | 'holdfold' | 'catchball' | 'mathpath' | 'patmat' | 'zapgrid' | 'capitals' | 'typecatch' | 'mathgrid' | 'wordflow' | 'colorblind' | 'memchain' | 'speedcd' | 'emojihunt' | 'taptarget' | 'numsort' | 'mathblitz' | 'letterdrop' | 'colorword' | 'speedtyping' | 'balloonpop' | 'quickfire' | 'pingpong2' | 'wordunscramble' | 'digitmemo' | 'emojistory' | 'neondodge' | 'currencyquiz' | 'multitap' | 'spellingbee' | null

const GAMES = [
  { id: 'bossraid' as const, emoji: '🐲', name: 'Boss Raid', desc: 'Besegra giganter', reward: '🪙120-350', hot: true },
  { id: 'arena' as const, emoji: '⚔️', name: 'Arena', desc: 'PvP turn-based strid', reward: '🪙30-150', hot: true },
  { id: 'dungeon' as const, emoji: '🏰', name: 'Dungeon', desc: '5 rum med fiender', reward: '🪙20-400+', hot: true },
  { id: 'battle' as const, emoji: '🗡️', name: 'Strid', desc: 'Turn-based PvE', reward: '🪙20-400', hot: true },
  { id: 'spin' as const, emoji: '🎰', name: 'Lyckhjulet', desc: 'Snurra & vinn', reward: '🪙25-200+', hot: true },
  { id: 'quiz' as const, emoji: '🧠', name: 'Quiz', desc: 'Trivia & kunskap', reward: '🪙10-120', hot: true },
  { id: 'whack' as const, emoji: '🐹', name: 'Hamra', desc: 'Tryck mullvadar', reward: '🪙0-90', hot: false },
  { id: 'dice' as const, emoji: '🎲', name: 'Tärning', desc: 'Satsa & rulla', reward: '🪙1.8-4x', hot: false },
  { id: 'speedmath' as const, emoji: '🧮', name: 'Snabbmatte', desc: '10 tal, 30 sek', reward: '🪙5-50', hot: false },
  { id: 'puzzle2048' as const, emoji: '🔢', name: '2048', desc: 'Slå ihop brickor', reward: '🪙500', hot: false },
  { id: 'runner' as const, emoji: '🏃', name: 'Runner', desc: 'Undvik hinder', reward: '🪙5-100', hot: false },
  { id: 'fishing' as const, emoji: '🎣', name: 'Fiske', desc: 'Fånga fiskar', reward: '🪙10-1000', hot: false },
  { id: 'snake' as const, emoji: '🐍', name: 'Snake', desc: 'Klassiskt', reward: '🪙5-50', hot: false },
  { id: 'memory' as const, emoji: '🃏', name: 'Minne', desc: 'Para ihop kort', reward: '🪙10-30', hot: false },
  { id: 'reaction' as const, emoji: '⚡', name: 'Reaktion', desc: 'Hur snabb?', reward: '🪙5-25', hot: false },
  { id: 'bubble' as const, emoji: '🫧', name: 'Bubblor', desc: 'Poppa bubblor!', reward: '🪙0-80', hot: false },
  { id: 'word' as const, emoji: '📝', name: 'Ordvrak', desc: 'Avkoda bokstäver', reward: '🪙0-150', hot: false },
  { id: 'color' as const, emoji: '🎨', name: 'Färgmatch', desc: 'Stroop-test — testa hjärnan!', reward: '🪙0-60', hot: false },
  { id: 'typer' as const, emoji: '⌨️', name: 'Skrivrace', desc: 'Skriv snabbt & exakt', reward: '🪙0-130', hot: false },
  { id: 'nummem' as const, emoji: '🔢', name: 'Sifferminne', desc: 'Memorera sekvenser', reward: '🪙0-230', hot: false },
  { id: 'emoji' as const, emoji: '🎭', name: 'Emojimönster', desc: 'Vad är nästa i sekvensen?', reward: '🪙0-160', hot: false },
  { id: 'tof' as const, emoji: '🤔', name: 'Sant/Falskt', desc: 'Trivia — sant eller falskt?', reward: '🪙0-200', hot: false },
  { id: 'grid' as const, emoji: '🔲', name: 'Grid Tap', desc: 'Tryck lysande rutor snabbt', reward: '🪙0-200', hot: false },
  { id: 'mathseq' as const, emoji: '🔣', name: 'Talsekvens', desc: 'Hitta det saknade talet', reward: '🪙0-240', hot: false },
  { id: 'hangman' as const, emoji: '🔡', name: 'Hänga Gubbe', desc: 'Gissa dolda ord', reward: '🪙0-480', hot: false },
  { id: 'simon' as const, emoji: '🔮', name: 'Simon Says', desc: 'Upprepa färgsekvensen', reward: '🪙0-360', hot: false },
  { id: 'sort' as const, emoji: '⚡', name: 'Snabbsortera', desc: 'Sortera emojis till kategori', reward: '🪙0-200', hot: false },
  { id: 'hl' as const, emoji: '📊', name: 'Högre/Lägre', desc: 'Är nästa siffra högre?', reward: '🪙0-192', hot: false },
  { id: 'wordle' as const, emoji: '🟩', name: 'Wordle SV', desc: 'Gissa 5-bokstavs ord, 6 försök', reward: '🪙60-300', hot: true },
  { id: 'war' as const, emoji: '🃏', name: 'Kortkrig', desc: 'Vänd kort — slå dealern!', reward: '🪙0-210', hot: false },
  { id: 'trivia' as const, emoji: '⚡', name: 'Trivia Blitz', desc: '12 frågor, 5s var — snabba svar!', reward: '🪙0-270', hot: true },
  { id: 'catch' as const, emoji: '🍎', name: 'Fångst Frenzy', desc: 'Fånga frukter, undvik bomber', reward: '🪙0-300', hot: false },
  { id: 'minesweeper' as const, emoji: '💣', name: 'Minröjning', desc: 'Klassisk minsökning 8×8', reward: '🪙100-500', hot: true },
  { id: 'rhythm' as const, emoji: '🥁', name: 'Rhythm Tap', desc: 'Tryck i takt med rytmen', reward: '🪙0-400', hot: false },
  { id: 'sudoku' as const, emoji: '🔢', name: 'Sudoku', desc: 'Klassisk sifferpussel 9×9', reward: '🪙200-800', hot: true },
  { id: 'race' as const, emoji: '🏁', name: 'Husdjursrace', desc: 'Tryck snabbt & vinn loppet', reward: '🪙50-400', hot: true },
  { id: 'tower' as const, emoji: '🏰', name: 'Tower Defense', desc: 'Bygg torn, stoppa fiender', reward: '🪙0-600', hot: true },
  { id: 'slots' as const, emoji: '🎰', name: 'Slots', desc: 'Snurra hjulen — tre lika vinner!', reward: '🪙0-10000', hot: true },
  { id: 'pinball' as const, emoji: '🎯', name: 'Pinball', desc: 'Håll bollen uppe med flipprarna', reward: '🪙0-800', hot: false },
  { id: 'typing' as const, emoji: '⌨️', name: 'Skrivhastighet', desc: 'Skriv ord på 60 sekunder', reward: '🪙0-400', hot: false },
  { id: 'bricks' as const, emoji: '🧱', name: 'Brickbreaker', desc: 'Slå brickor med bollen', reward: '🪙0-500', hot: false },
  { id: 'slide' as const, emoji: '🧩', name: 'Glidpussel', desc: 'Ordna emoji-brickor 3×3', reward: '🪙10-100', hot: false },
  { id: 'flappy' as const, emoji: '🪶', name: 'Flappy Pet', desc: 'Flyg genom rören!', reward: '🪙0-300', hot: true },
  { id: 'csort' as const, emoji: '🎨', name: 'Färgsortering', desc: 'Sortera färger i rör', reward: '🪙20-200', hot: false },
  { id: 'shooter' as const, emoji: '🚀', name: 'Space Shooter', desc: 'Skjut aliens i rymden', reward: '🪙0-600', hot: true },
  { id: 'dodge' as const, emoji: '⚡', name: 'Dodgeball', desc: 'Undvik faror, samla stjärnor', reward: '🪙0-500', hot: false },
  { id: 'numcrunch' as const, emoji: '🔢', name: 'Talknas', desc: 'Tryck 1-16 i ordning snabbt', reward: '🪙0-300', hot: false },
  { id: 'taprush' as const, emoji: '👆', name: 'Tap Rush', desc: 'Samla bra, undvik dåligt 10s', reward: '🪙0-400', hot: false },
  { id: 'anagram' as const, emoji: '🔤', name: 'Anagram', desc: 'Blanda om bokstäver till ord', reward: '🪙0-400', hot: false },
  { id: 'pairmatch' as const, emoji: '🎴', name: 'Para Kort', desc: 'Hitta matchande emoji-par 4×4', reward: '🪙20-200', hot: false },
  { id: 'lmath' as const, emoji: '⚡', name: 'Blixttabell', desc: 'Välj rätt svar! 60s med streak', reward: '🪙0-600', hot: true },
  { id: 'eguess' as const, emoji: '🤔', name: 'Emoji-Gissare', desc: 'Vad föreställer emojis?', reward: '🪙0-400', hot: false },
  { id: 'wchain' as const, emoji: '🔗', name: 'Ordkedja', desc: 'Bygg ordkedja mot datorn', reward: '🪙0-500', hot: false },
  { id: 'stealth' as const, emoji: '🕵️', name: 'Smygare', desc: 'Undvik vakter & nå skatten', reward: '🪙0-600', hot: true },
  { id: 'ttt' as const, emoji: '⭕', name: 'Tre-i-rad', desc: 'Tic-tac-toe mot AI', reward: '🪙0-500', hot: false },
  { id: 'mastermind' as const, emoji: '🎯', name: 'Mastermind', desc: 'Knäck den hemliga koden', reward: '🪙0-700', hot: true },
  { id: 'c4' as const, emoji: '🔵', name: 'Fyra i rad', desc: 'Klassisk Connect Four mot AI', reward: '🪙0-600', hot: false },
  { id: 'rps' as const, emoji: '✂️', name: 'Sten Sax Påse', desc: 'Bäst av 5 mot datorn', reward: '🪙0-400', hot: false },
  { id: 'pong' as const, emoji: '🏓', name: 'Pong', desc: 'Klassisk Pong mot AI', reward: '🪙0-350', hot: false },
  { id: 'blackjack' as const, emoji: '🃏', name: 'Blackjack', desc: 'Kom närmast 21 mot dealer', reward: '🪙Variabel', hot: true },
  { id: 'flagquiz' as const, emoji: '🌍', name: 'Flaggquiz', desc: 'Gissa landet från flaggan', reward: '🪙0-450', hot: false },
  { id: 'balance' as const, emoji: '⚖️', name: 'Balans', desc: 'Studsa bollen på racket', reward: '🪙0-500', hot: false },
  { id: 'wordsearch' as const, emoji: '🔤', name: 'Ordsökning', desc: 'Hitta dolda djurnamn', reward: '🪙0-480', hot: false },
  { id: 'speedtap' as const, emoji: '👆', name: 'Speed Tap', desc: 'Tryck snabbast möjligt 10s', reward: '🪙0-500', hot: true },
  { id: 'gemswap' as const, emoji: '💎', name: 'Ädelstenar', desc: 'Byt platser för rad om 3', reward: '🪙0-600', hot: true },
  { id: 'typeduel' as const, emoji: '⌨️', name: 'Typduell', desc: 'Skriv fallande ord i tid', reward: '🪙0-700', hot: false },
  { id: 'catchfruit' as const, emoji: '🍎', name: 'Fånga Frukter', desc: 'Fånga frukter undvik bomber', reward: '🪙0-500', hot: false },
  { id: 'countdown' as const, emoji: '🔢', name: 'Countdown', desc: 'Nå målvärdet med siffror', reward: '🪙0-600', hot: true },
  { id: 'bubshoot' as const, emoji: '🎯', name: 'Bubbel Shooter', desc: 'Skjut bubblor & gör grupper om 3+', reward: '🪙0-800', hot: true },
  { id: 'lights' as const, emoji: '💡', name: 'Lights Out', desc: 'Klicka celler — släck alla lampor', reward: '🪙0-700', hot: false },
  { id: 'oddout' as const, emoji: '🔍', name: 'Hitta Skillnaden', desc: 'Spot the odd emoji in the grid', reward: '🪙0-600', hot: true },
  { id: 'reflexcolor' as const, emoji: '🌈', name: 'Reflex Färg', desc: 'Tryck rätt färg så snabbt du kan!', reward: '🪙0-500', hot: true },
  { id: 'mathduel' as const, emoji: '⚔️', name: 'Matteduel', desc: 'Lös matte mot klockan, streak bonus', reward: '🪙0-700', hot: true },
  { id: 'treasure' as const, emoji: '🗺️', name: 'Skattjakt', desc: 'Hitta skatter, undvik fällor i rutnät', reward: '🪙0-800', hot: true },
  { id: 'shadowmatch' as const, emoji: '👤', name: 'Skugg-Match', desc: 'Matcha skugga med rätt emoji', reward: '🪙0-700', hot: false },
  { id: 'stacktower' as const, emoji: '🏗️', name: 'Stapla Torn', desc: 'Tryck rätt — stapla block högt!', reward: '🪙0-600', hot: true },
  { id: 'ppairs' as const, emoji: '🎴', name: 'Par-Pussel', desc: 'Hitta matchande emoji-par mot klockan', reward: '🪙0-700', hot: false },
  { id: 'emojicode' as const, emoji: '🔑', name: 'Emoji-Kod', desc: 'Gissa vilket ord emojis representerar', reward: '🪙0-800', hot: true },
  { id: 'patternrep' as const, emoji: '🔮', name: 'Mönsterminne', desc: 'Memorera och upprepa ljussekvenser', reward: '🪙0-900', hot: true },
  { id: 'targetclick' as const, emoji: '🎯', name: 'Måljakt', desc: 'Klicka mål, undvik bomber 25s', reward: '🪙0-600', hot: true },
  { id: 'wordbomb' as const, emoji: '💣', name: 'Ordbömbaren', desc: 'Skriv ord med stavelsen innan bomben', reward: '🪙0-700', hot: true },
  { id: 'numline' as const, emoji: '📏', name: 'Nummerlinje', desc: 'Tryck rätt plats på 0-100 linjen', reward: '🪙0-1000', hot: false },
  { id: 'pressmeter' as const, emoji: '⚡', name: 'Kraftmätare', desc: 'Håll in — släpp i den gröna zonen!', reward: '🪙0-800', hot: true },
  { id: 'sumflash' as const, emoji: '🔢', name: 'Summaflash', desc: '5 siffror blinkar — addera i huvudet!', reward: '🪙0-700', hot: true },
  { id: 'darts' as const, emoji: '🎯', name: 'Pilkastning', desc: 'Timing-spel — tryck när korset är i mitten', reward: '🪙0-500', hot: false },
  { id: 'letterchaos' as const, emoji: '🔤', name: 'Bokstavkaos', desc: 'Tryck bokstäver, undvik bomber 30s', reward: '🪙0-800', hot: true },
  { id: 'factfiction' as const, emoji: '🧐', name: 'Fakta/Fiktion', desc: 'Sant eller falskt? Djurfakta 10 frågor', reward: '🪙0-600', hot: true },
  { id: 'gridremem' as const, emoji: '🟩', name: 'Rutnätsminne', desc: 'Memorera och återskapa rutmönster', reward: '🪙0-800', hot: false },
  { id: 'quicksum' as const, emoji: '➕', name: 'Snabbsumma', desc: 'Hitta paret som summerar till målet!', reward: '🪙0-700', hot: true },
  { id: 'animalsound' as const, emoji: '🔊', name: 'Djurljud', desc: 'Vilket ljud gör djuret? 10 frågor', reward: '🪙0-600', hot: false },
  { id: 'colormix2' as const, emoji: '🎨', name: 'Färgblandning', desc: 'Vilka färger blandar till denna? 10 runder', reward: '🪙0-600', hot: false },
  { id: 'snapcard' as const, emoji: '🃏', name: 'SNAP!', desc: 'Tryck SNAP när samma kort visas igen!', reward: '🪙0-700', hot: true },
  { id: 'spellingg' as const, emoji: '📝', name: 'Stavning', desc: 'Vilken stavning är korrekt? 4 val, 10 runder', reward: '🪙0-600', hot: false },
  { id: 'bubblemath' as const, emoji: '🫧', name: 'Bubbelmatematik', desc: 'Ploppa bubblor med rätt tal — 30 sekunder', reward: '🪙0-700', hot: true },
  { id: 'pathfinder' as const, emoji: '🗺️', name: 'Vägfinnaren', desc: 'Rita väg från start till mål — undvik väggar', reward: '🪙0-800', hot: true },
  { id: 'typingrain' as const, emoji: '🌧️', name: 'Ordregn', desc: 'Skriv fallande ord innan de träffar marken', reward: '🪙0-700', hot: false },
  { id: 'colorseq' as const, emoji: '🌈', name: 'Färgsekvens', desc: 'Memorera och upprepa färgordningen', reward: '🪙0-900', hot: true },
  { id: 'speedcount' as const, emoji: '🔢', name: 'Snabbräknaren', desc: 'Räkna emojis snabbt — välj rätt antal', reward: '🪙0-700', hot: false },
  { id: 'memflip' as const, emoji: '🔀', name: 'Flip & Match', desc: 'Vänd och para 8 emoji-par på 4×4', reward: '🪙0-800', hot: false },
  { id: 'mirrordraw' as const, emoji: '🪞', name: 'Spegelritning', desc: 'Rita spegelbilden av mönstret — 8 runder', reward: '🪙0-900', hot: true },
  { id: 'truthdare' as const, emoji: '🎲', name: 'Sanning/Konka', desc: 'Välj utmaning och klara den för streak-bonus', reward: '🪙0-700', hot: false },
  { id: 'beatbuilder' as const, emoji: '🎹', name: 'Beat Builder', desc: 'Bygg och spela upp din trummaskin', reward: '🪙0-800', hot: true },
  { id: 'wordguess' as const, emoji: '🔤', name: 'Ordgissaren', desc: 'Gissa svenska ord bokstav för bokstav', reward: '🪙0-750', hot: false },
  { id: 'numpuzzle' as const, emoji: '🔣', name: 'Taloperatorn', desc: 'Välj rätt operator för ekvationen', reward: '🪙0-700', hot: true },
  { id: 'tilematch' as const, emoji: '🍎', name: 'Frukttrio', desc: 'Para frukter på 6×8 bräde — 60 sekunder', reward: '🪙0-800', hot: true },
  { id: 'direction' as const, emoji: '🧭', name: 'Pilkompassen', desc: 'Tryck pilsekvenser snabbt och exakt', reward: '🪙0-700', hot: false },
  { id: 'balloons' as const, emoji: '🎈', name: 'Ballonger', desc: 'Hitta rätt siffra bland ballonger 30s', reward: '🪙0-600', hot: false },
  { id: 'mathmaze' as const, emoji: '🔢', name: 'Mattematrisen', desc: 'Tryck alla uttryck lika med måltalet', reward: '🪙0-700', hot: true },
  { id: 'gridflood' as const, emoji: '🌊', name: 'Färgflod', desc: 'Flood-fill hela brädet på 22 drag!', reward: '🪙0-900', hot: true },
  { id: 'emojifind' as const, emoji: '🔍', name: 'Emojijakt', desc: 'Hitta och tryck alla målemojis', reward: '🪙0-700', hot: false },
  { id: 'mathblind' as const, emoji: '🧠', name: 'Blindmatte', desc: 'Uppgift visas 1.5s — minns och svara!', reward: '🪙0-800', hot: true },
  { id: 'colorflash' as const, emoji: '🌈', name: 'Färgminne', desc: 'Vilken färg blinkade mest? 10 runder', reward: '🪙0-700', hot: true },
  { id: 'chameleon' as const, emoji: '🦎', name: 'Kameleont', desc: 'Hitta rutan med annan nyans i rutnätet', reward: '🪙0-800', hot: true },
  { id: 'multiplyrace' as const, emoji: '✖️', name: 'Tabellrace', desc: 'Multiplikationstabeller i ordning 45s', reward: '🪙0-700', hot: false },
  { id: 'swapsort' as const, emoji: '🔀', name: 'Byt & Sortera', desc: 'Sortera siffror med så få byten som möjligt', reward: '🪙0-700', hot: true },
  { id: 'fraction' as const, emoji: '➗', name: 'Bråkduellen', desc: 'Vilket bråk är störst? 15 frågor 4s var', reward: '🪙0-600', hot: false },
  { id: 'stopclock' as const, emoji: '⏱️', name: 'Stoppur', desc: 'Stoppa klockan exakt vid måltiden', reward: '🪙0-125', hot: true },
  { id: 'wordsnap' as const, emoji: '🎯', name: 'Word Snap', desc: 'SNAP om ordet tillhör kategorin!', reward: '🪙0-500', hot: true },
  { id: 'numbubble' as const, emoji: '🫧', name: 'Talbubblan', desc: 'Poppa bubblor i stigande ordning 35s', reward: '🪙0-400', hot: true },
  { id: 'holdfold' as const, emoji: '💣', name: 'Hold or Fold', desc: 'Multiplicera värdet — håll nerven!', reward: '🪙0-500', hot: true },
  { id: 'catchball' as const, emoji: '⚽', name: 'Fånga Bollen', desc: 'Studsa bollen — tryck den 30s!', reward: '🪙0-300', hot: true },
  { id: 'mathpath' as const, emoji: '🗺️', name: 'Talstigen', desc: 'Navigera rutnätet — max summa!', reward: '🪙0-600', hot: false },
  { id: 'patmat' as const, emoji: '🔲', name: 'Matris', desc: 'Hitta det saknade emojit i 3×3 matrisen', reward: '🪙0-200', hot: true },
  { id: 'zapgrid' as const, emoji: '⚡', name: 'Zap Grid', desc: 'Tryck blixtar i rutnätet innan de försvinner', reward: '🪙0-400', hot: true },
  { id: 'capitals' as const, emoji: '🌍', name: 'Huvudstäder', desc: 'Vad är landets huvudstad? 12 frågor', reward: '🪙0-120', hot: false },
  { id: 'typecatch' as const, emoji: '🔤', name: 'Bokstavsjakten', desc: 'Fånga fallande bokstäver 35s', reward: '🪙0-300', hot: true },
  { id: 'mathgrid' as const, emoji: '✖️', name: 'MatteGrid', desc: 'Tryck rätt svar i rutnätet! 15 uppgifter', reward: '🪙0-450', hot: true },
  { id: 'wordflow' as const, emoji: '🌊', name: 'Ordflödet', desc: 'Skriv svenska ord innan de försvinner', reward: '🪙0-500', hot: false },
  { id: 'colorblind' as const, emoji: '🎨', name: 'Hitta Avvikaren', desc: 'Tryck rutan med annan nyans! 20 runder', reward: '🪙0-600', hot: true },
  { id: 'memchain' as const, emoji: '🧠', name: 'Minneskedja', desc: 'Upprepa växande emoji-sekvens', reward: '🪙0-500', hot: true },
  { id: 'speedcd' as const, emoji: '⏳', name: 'Räkna Ner', desc: 'Tryck 20→1 i ordning, 10 ronder', reward: '🪙0-500', hot: true },
  { id: 'emojihunt' as const, emoji: '🔍', name: 'Emojijägaren', desc: 'Hitta alla dolda målemojis i rutnätet', reward: '🪙0-600', hot: true },
  { id: 'taptarget' as const, emoji: '🎯', name: 'Tap Attack', desc: 'Tryck cirklar innan de försvinner 30s', reward: '🪙0-500', hot: true },
  { id: 'numsort' as const, emoji: '🔀', name: 'Talsortering', desc: 'Byt plats och sortera siffror, 8 ronder', reward: '🪙0-400', hot: false },
  { id: 'mathblitz' as const, emoji: '⚡', name: 'Math Blitz', desc: 'Svara snabbt på 20 mattetal, 45 sek', reward: '🪙0-240', hot: true },
  { id: 'letterdrop' as const, emoji: '🔡', name: 'Letter Drop', desc: 'Fånga rätt bokstav när de faller ner, 40s', reward: '🪙0-350', hot: false },
  { id: 'colorword' as const, emoji: '🎨', name: 'Färgord JA/NEJ', desc: 'Matchar texten färgen? JA/NEJ, 30 sek', reward: '🪙0-320', hot: true },
  { id: 'speedtyping' as const, emoji: '⌨️', name: 'Speed Typing', desc: 'Skriv ord så snabbt du kan, 60 sek', reward: '🪙0-250', hot: false },
  { id: 'balloonpop' as const, emoji: '🎈', name: 'Ballongpopp', desc: 'Poppa ballonger som stiger upp, 35 sek', reward: '🪙0-300', hot: true },
  { id: 'quickfire' as const, emoji: '🔥', name: 'Quick Fire', desc: '10 frågor om allt! 10 sek per fråga', reward: '🪙0-180', hot: false },
  { id: 'pingpong2' as const, emoji: '🏓', name: 'Pingis', desc: 'Spela pingis mot datorn — vinn 7 poäng!', reward: '🪙0-140', hot: true },
  { id: 'wordunscramble' as const, emoji: '🔤', name: 'Ordpussel', desc: 'Bokstäver om varandra — skriv rätt ord, 60s', reward: '🪙0-280', hot: false },
  { id: 'digitmemo' as const, emoji: '🔢', name: 'Sifferminne', desc: 'Memorera siffersekvenssen, 8 ronder', reward: '🪙0-160', hot: false },
  { id: 'emojistory' as const, emoji: '📖', name: 'Emoji-historia', desc: 'Vad berättar emojisarna? 8 frågor', reward: '🪙0-128', hot: true },
  { id: 'neondodge' as const, emoji: '💚', name: 'Neon Dodge', desc: 'Undvik fallande neonblock, klara 30 sek', reward: '🪙0-60', hot: true },
  { id: 'currencyquiz' as const, emoji: '💰', name: 'Valutaquiz', desc: 'Vilken valuta använder landet? 10 frågor', reward: '🪙0-150', hot: false },
  { id: 'multitap' as const, emoji: '👆', name: 'Multitap', desc: 'Tryck så snabbt du kan på 10 sekunder!', reward: '🪙0-200', hot: true },
  { id: 'spellingbee' as const, emoji: '🐝', name: 'Stavningsbiet', desc: 'Stava rätt utifrån ledtråden, 10 ord', reward: '🪙0-180', hot: false },
]

function weekKey() {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  return `k0509_wk_${Math.floor(Date.now() / msPerWeek)}`
}

function getActiveEvent() {
  const hour = new Date().getHours()
  const day = new Date().getDay()
  if (day === 0 || day === 6) return { emoji: '🎉', name: 'HELGFESTIVAL', desc: 'Alla spel +25% XP', color: '#aa66ff', rgb: '170,102,255' }
  if (hour >= 6 && hour < 10) return { emoji: '🌅', name: 'MORGONRUSH', desc: '+20% XP-bonus t.o.m. 10:00', color: '#ffcc00', rgb: '255,204,0' }
  if (hour >= 11 && hour < 14) return { emoji: '🍽️', name: 'LUNCHLYCKA', desc: 'Fiske ger dubbel XP', color: '#4ade80', rgb: '74,222,128' }
  if (hour >= 18 && hour < 22) return { emoji: '⚔️', name: 'KVÄLLSRÄD', desc: 'Boss Raid +50% belöning', color: '#f87171', rgb: '248,113,113' }
  return { emoji: '🌅', name: 'SOMMERFESTIVALEN 2026', desc: 'Bonus XP +25% · Exklusiva belöningar', color: '#ffcc00', rgb: '255,204,0' }
}

export const GamesView = memo(function GamesView() {
  const [activeGame, setActiveGame] = useState<GameId>(null)
  const { awardCoins, awardXP } = useGame()
  const recordBattleWin = useGameStore(s => s.recordBattleWin)
  const recordFishCaught = useGameStore(s => s.recordFishCaught)
  const recordRunnerScore = useGameStore(s => s.recordRunnerScore)
  const recordMissionProgress = useGameStore(s => s.recordMissionProgress)
  const showToast = useUIStore(s => s.showToast)
  const pushNotif = useUIStore(s => s.pushNotif)
  const triggerConfetti = useUIStore(s => s.triggerConfetti)
  const runnerBest = useGameStore(s => s.pet.runnerBest)
  const battleWins = useGameStore(s => s.pet.battleWins)
  const fishCaught = useGameStore(s => s.pet.fishCaught)
  const petEmoji = useGameStore(s => s.pet.petEmoji)
  const coins = useGameStore(s => s.pet.coins)
  const spendCoins = useGameStore(s => s.spendCoins)
  const gainKC = useGameStore(s => s.gainKC)
  const [weeklyClaimed, setWeeklyClaimed] = useState(() => !!localStorage.getItem(weekKey()))

  const weekChallenge = useMemo(() => {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000
    const weekNum = Math.floor(Date.now() / msPerWeek)
    const challenges = [
      { title: 'Vinn 10 Strider', goal: 10, current: battleWins, game: 'battle', reward: '500 🪙 + 20 KC', emoji: '⚔️', coins: 500, kc: 20 },
      { title: 'Fånga 20 Fiskar', goal: 20, current: fishCaught, game: 'fishing', reward: '400 🪙 + 15 KC', emoji: '🎣', coins: 400, kc: 15 },
      { title: 'Spring 300m', goal: 300, current: runnerBest, game: 'runner', reward: '300 🪙 + 10 KC', emoji: '🏃', coins: 300, kc: 10 },
    ]
    return challenges[weekNum % challenges.length]
  }, [battleWins, fishCaught, runnerBest])

  const claimWeekly = () => {
    if (weeklyClaimed || weekChallenge.current < weekChallenge.goal) return
    awardCoins(weekChallenge.coins)
    gainKC(weekChallenge.kc)
    localStorage.setItem(weekKey(), '1')
    setWeeklyClaimed(true)
    showToast(`🏆 Veckoutmaning klar! +${weekChallenge.coins}🪙 +${weekChallenge.kc}💎`, 'success')
    pushNotif('🏆', `Veckans utmaning klar! +${weekChallenge.coins} mynt`)
    triggerConfetti()
    audio.achievement()
  }

  const handleGenericWin = (coins: number, xp: number) => {
    awardCoins(coins); awardXP(xp, 'game'); audio.achievement()
    showToast(`+${formatNumber(coins)} 🪙 +${xp} XP`, 'success')
  }

  const handle2048Win = (coins: number, xp: number) => {
    awardCoins(coins); awardXP(xp, 'game'); audio.achievement()
    showToast(`🔢 2048 CLEARED! +${formatNumber(coins)} 🪙 +${xp} XP`, 'success')
    pushNotif('🔢', `Du klarade 2048! +${coins} mynt belöning!`)
  }

  const handleBattleWin = (coins: number, xp: number) => {
    awardCoins(coins); awardXP(xp, 'battle'); audio.achievement()
    recordBattleWin()
    showToast(`⚔️ Seger! +${coins} 🪙`, 'success')
    pushNotif('⚔️', `Du vann en strid! +${coins} mynt`)
  }

  const handleFishCatch = (fish: FishType, coins: number, xp: number) => {
    awardCoins(coins); awardXP(xp, 'fish'); audio.coin()
    recordFishCaught()
    showToast(`${fish.emoji} Fångade ${fish.name}! +${coins} 🪙`, 'success')
    if (fish.rarity === 'legendary') pushNotif(fish.emoji, `LEGENDÄRT! Du fångade ${fish.name}!`)
  }

  const handleRunnerWin = (coins: number, xp: number, score: number) => {
    awardCoins(coins); awardXP(xp, 'runner')
    recordRunnerScore(score)
    showToast(`🏃 ${score}m! +${coins} 🪙`, 'success')
  }

  if (activeGame === 'snake') return <SnakeGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} petEmoji={petEmoji} />
  if (activeGame === 'memory') return <MemoryGame onExit={() => setActiveGame(null)} onWin={(c, xp) => { handleGenericWin(c, xp); recordMissionProgress('memory') }} />
  if (activeGame === 'reaction') return <ReactionGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'runner') return <RunnerGame onExit={() => setActiveGame(null)} onWin={handleRunnerWin} petEmoji={petEmoji} runnerBest={runnerBest} />
  if (activeGame === 'fishing') return <FishingGame onExit={() => setActiveGame(null)} onCatch={handleFishCatch} />
  if (activeGame === 'battle') return <BattleGame onExit={() => setActiveGame(null)} onWin={handleBattleWin} />
  if (activeGame === 'puzzle2048') return <Puzzle2048 onExit={() => setActiveGame(null)} onWin={handle2048Win} />
  if (activeGame === 'spin') return <SpinGame onExit={() => setActiveGame(null)} onWin={(c, xp) => handleGenericWin(c, xp)} />
  if (activeGame === 'bossraid') return <BossRaidGame onExit={() => setActiveGame(null)} onWin={handleBattleWin} petEmoji={petEmoji} />
  if (activeGame === 'dice') return <DiceGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} coins={coins} spendCoins={spendCoins} />
  if (activeGame === 'speedmath') return <SpeedMathGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'whack') return <WhackMoleGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'quiz') return <QuizGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'arena') return <ArenaGame onExit={() => setActiveGame(null)} onWin={(c, xp) => { handleBattleWin(c, xp) }} petEmoji={petEmoji} />
  if (activeGame === 'dungeon') return <DungeonGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} petEmoji={petEmoji} />
  if (activeGame === 'bubble') return <BubblePopGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'word') return <WordScrambleGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'color') return <ColorMatchGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'typer') return <TypeRacerGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'nummem') return <NumberMemoryGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'emoji') return <EmojiPatternGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'tof') return <TrueOrFalseGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'grid') return <GridTapGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'mathseq') return <MathSequenceGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'hangman') return <HangmanGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'simon') return <SimonSaysGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'sort') return <SpeedSortGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'hl') return <HigherLowerGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'wordle') return <WordleGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'war') return <CardWarGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'trivia') return <TriviaBlitzGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'catch') return <CatchFrenzyGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'minesweeper') return <MinesweeperGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'rhythm') return <RhythmTapGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'sudoku') return <SudokuGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'race') return <PetRaceGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} petEmoji={petEmoji} />
  if (activeGame === 'tower') return <TowerDefenseGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'slots') return <SlotMachineGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} coins={coins} />
  if (activeGame === 'pinball') return <PinballGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'typing') return <TypingSpeedGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'bricks') return <BrickBreakerGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'slide') return <SlidingPuzzleGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'flappy') return <FlappyPetGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} petEmoji={petEmoji} />
  if (activeGame === 'csort') return <ColorSortGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'shooter') return <SpaceShooterGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'dodge') return <DodgeBallGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} petEmoji={petEmoji} />
  if (activeGame === 'numcrunch') return <NumberCrunchGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'taprush') return <TapRushGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'anagram') return <AnagramGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'pairmatch') return <PairMatchGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'lmath') return <LightningMathGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'eguess') return <EmojiGuesserGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'wchain') return <WordChainGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'stealth') return <StealthGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} petEmoji={petEmoji} />
  if (activeGame === 'ttt') return <TicTacToeGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'mastermind') return <MastermindGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'c4') return <ConnectFourGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'rps') return <RockPaperScissorsGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'pong') return <PongGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'blackjack') return <BlackjackGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} coins={coins} />
  if (activeGame === 'flagquiz') return <FlagQuizGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'balance') return <BalanceBallGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'wordsearch') return <WordSearchGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'speedtap') return <SpeedTapGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'gemswap') return <GemSwapGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'typeduel') return <TypingDuelGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'catchfruit') return <CatchFruitGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'countdown') return <CountdownGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'bubshoot') return <BubbleShooterGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'lights') return <LightsOutGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'oddout') return <OddOneOutGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'reflexcolor') return <ReflexColorGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'mathduel') return <MathDuelGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'treasure') return <TreasureHuntGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'shadowmatch') return <ShadowMatchGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'stacktower') return <StackTowerGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'ppairs') return <PuzzlePairsGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'emojicode') return <EmojiCodeGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'patternrep') return <PatternRepeatGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'targetclick') return <TargetClickGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'wordbomb') return <WordBombGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'numline') return <NumberLineGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'pressmeter') return <PressMeterGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'sumflash') return <SumFlashGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'darts') return <DartsGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'letterchaos') return <LetterChaosGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'factfiction') return <FactFictionGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'gridremem') return <GridRememberGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'quicksum') return <QuickSumGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'animalsound') return <AnimalSoundGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'colormix2') return <ColorMixGame2 onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'snapcard') return <SnapCardGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'spellingg') return <SpellingGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'bubblemath') return <BubbleMathGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'pathfinder') return <PathfinderGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'typingrain') return <TypingRainGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'colorseq') return <ColorSequenceGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'speedcount') return <SpeedCountGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'memflip') return <MemoryFlipGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'mirrordraw') return <MirrorDrawGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'truthdare') return <TruthOrDareGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'beatbuilder') return <BeatBuilderGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'wordguess') return <WordGuesserGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'numpuzzle') return <NumberPuzzleGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'tilematch') return <TileMatchGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'direction') return <DirectionGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'balloons') return <BalloonSortGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'mathmaze') return <MathMazeGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'gridflood') return <GridFloodGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'emojifind') return <EmojiFindGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'mathblind') return <MathBlindGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'colorflash') return <ColorFlashGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'chameleon') return <ChameleonGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'multiplyrace') return <MultiplyRaceGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'swapsort') return <SwapSortGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'fraction') return <FractionGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'stopclock') return <StopClockGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'wordsnap') return <WordSnapGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'numbubble') return <NumBubbleGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'holdfold') return <HoldFoldGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'catchball') return <CatchBallGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'mathpath') return <MathPathGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'patmat') return <PatternMatrixGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'zapgrid') return <ZapGridGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'capitals') return <CapitalsGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'typecatch') return <TypeCatchGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'mathgrid') return <MathGridGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'wordflow') return <WordFlowGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'colorblind') return <ColorBlindGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'memchain') return <MemoryChainGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'speedcd') return <SpeedCountdownGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'emojihunt') return <EmojiHuntGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'taptarget') return <TapTargetGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'numsort') return <NumberSortGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'mathblitz') return <MathBlitzGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'letterdrop') return <LetterDropGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'colorword') return <ColorWordGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'speedtyping') return <SpeedTypingGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'balloonpop') return <BalloonPopGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'quickfire') return <QuickFireGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'pingpong2') return <PingPongGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'wordunscramble') return <WordUnscrambleGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'digitmemo') return <DigitMemoGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'emojistory') return <EmojiStoryGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'neondodge') return <NeonDodgeGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'currencyquiz') return <CurrencyQuizGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'multitap') return <MultiTapGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'spellingbee') return <SpellingBeeGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />

  return (
    <>
      <div className="games-header-2027">
        <div className="games-title-2027">🎮 GAMES</div>
        <div className="games-daily-xp-badge">+{(battleWins + fishCaught) * 10} XP idag</div>
      </div>

      {/* Weekly Challenge */}
      <div style={{ padding: '0 14px 12px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(170,102,255,.12), rgba(68,136,255,.08))',
          border: '1px solid rgba(170,102,255,.3)',
          borderRadius: 16,
          padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>🗓️</span>
              <span style={{ fontFamily: 'var(--ff-head)', fontSize: 12, fontWeight: 900, color: 'var(--purple)', letterSpacing: 1 }}>VECKANS UTMANING</span>
            </div>
            <span style={{ fontSize: 10, color: 'var(--t3)' }}>Återst. måndag</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>{weekChallenge.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{weekChallenge.title}</div>
              <div style={{ background: 'rgba(0,0,0,.3)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (weekChallenge.current / weekChallenge.goal) * 100)}%`,
                  background: 'linear-gradient(90deg, var(--purple), var(--blue))',
                  borderRadius: 6,
                  transition: 'width .4s',
                }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3 }}>
                {Math.min(weekChallenge.current, weekChallenge.goal)}/{weekChallenge.goal} · {weekChallenge.reward}
              </div>
            </div>
            {weekChallenge.current >= weekChallenge.goal && !weeklyClaimed && (
              <button
                onClick={claimWeekly}
                style={{
                  background: 'linear-gradient(135deg, var(--gold), #ff8844)',
                  border: 'none', borderRadius: 10, padding: '8px 12px',
                  fontFamily: 'var(--ff-head)', fontSize: 11, fontWeight: 900, color: '#000',
                  cursor: 'pointer', flexShrink: 0,
                }}
              >Hämta!</button>
            )}
            {weeklyClaimed && (
              <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 900, flexShrink: 0 }}>✓ Klar</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '0 14px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ background: 'rgba(255,68,85,.12)', border: '1px solid rgba(255,68,85,.3)', borderRadius: 12, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: 'var(--red)', whiteSpace: 'nowrap' }}>⚔️ {battleWins} segrar</div>
        <div style={{ background: 'rgba(0,255,136,.12)', border: '1px solid rgba(0,255,136,.3)', borderRadius: 12, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: 'var(--green)', whiteSpace: 'nowrap' }}>🏃 {runnerBest}m rekord</div>
        <div style={{ background: 'rgba(68,136,255,.12)', border: '1px solid rgba(68,136,255,.3)', borderRadius: 12, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: 'var(--blue)', whiteSpace: 'nowrap' }}>🎣 {fishCaught} fisk</div>
      </div>

      {/* Dynamic Event Banner */}
      {(() => {
        const ev = getActiveEvent()
        return (
          <div style={{ padding: '0 14px 12px' }}>
            <div style={{
              background: `linear-gradient(135deg, rgba(${ev.rgb},.12), rgba(${ev.rgb},.05))`,
              border: `1px solid rgba(${ev.rgb},.3)`,
              borderRadius: 16, padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 32 }}>{ev.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--ff-head)', fontSize: 13, fontWeight: 900, color: ev.color, letterSpacing: 1 }}>
                  {ev.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{ev.desc}</div>
              </div>
              <div style={{
                background: `rgba(${ev.rgb},.2)`, border: `1px solid rgba(${ev.rgb},.4)`,
                borderRadius: 8, padding: '4px 8px', fontSize: 10, fontWeight: 900, color: ev.color,
                whiteSpace: 'nowrap',
              }}>
                LIVE ●
              </div>
            </div>
          </div>
        )
      })()}

      <div className="games-grid-2027">
        {GAMES.map(g => {
          const pb = g.id === 'battle' ? `⚔️ ${battleWins} seg.`
            : g.id === 'runner' ? `🏃 ${runnerBest}m`
            : g.id === 'fishing' ? `🎣 ${fishCaught} fisk`
            : null
          return (
            <button
              key={g.id}
              className={`game-card-2027${g.hot ? ' hot' : ''}`}
              onClick={() => { setActiveGame(g.id); audio.click() }}
            >
              <div className="game-card-icon">{g.emoji}</div>
              <div className="game-card-name">{g.name}</div>
              <div className="game-card-xp">{g.desc}</div>
              <div className="game-card-badge">{g.reward}</div>
              {pb && <div style={{ fontSize: 8, color: 'var(--t3)', marginTop: 2, fontWeight: 700 }}>{pb}</div>}
            </button>
          )
        })}
      </div>

      <div className="vend" />
    </>
  )
})
