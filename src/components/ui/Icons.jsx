import React from "react";
import {
  Camera,
  Atom,
  Calculator,
  Code2,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Activity,
  Zap,
  Globe,
  Pin,
  FlaskConical,
  BookOpen,
  Flame,
  Leaf,
  Image,
  Layers,
  HelpCircle,
  KeyRound,
  BarChart3,
  Sparkles,
  Trophy,
  ThumbsUp,
  Award,
  WifiOff,
  Lock,
  Palette,
  Trash2,
  Pencil,
  PenTool,
  Lightbulb,
  Search,
  MapPin,
  Brain,
  MessageSquare,
  Smartphone,
  Check,
  X,
  Compass,
  Move,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand,
  RotateCw,
  AlertCircle,
  Play,
  Share2,
  Copy,
  ChevronRight,
  ChevronLeft,
  Bell,
  User,
  Sliders,
} from "lucide-react";

/**
 * Maps legacy emoji strings or icon keys to modern SVG Lucide components.
 */
export function StudyIcon({ name, className = "w-5 h-5", ...props }) {
  if (!name) return <FileText className={className} {...props} />;

  // If already a React element
  if (React.isValidElement(name)) return name;

  const key = String(name).trim();

  switch (key) {
    // Canvas & Folders
    case "camera":
    case "📸":
    case "📷":
      return <Camera className={className} {...props} />;
    case "science":
    case "atom":
    case "⚛️":
      return <Atom className={className} {...props} />;
    case "math":
    case "calculator":
    case "√x":
    case "📐":
      return <Calculator className={className} {...props} />;
    case "code":
    case "cs":
    case "</>":
      return <Code2 className={className} {...props} />;
    case "physics":
    case "note":
    case "notes":
    case "📝":
    case "✏️":
    case "🖊":
      return <FileText className={className} {...props} />;
    case "folder":
    case "📁":
      return <Folder className={className} {...props} />;
    case "folder-open":
    case "📂":
      return <FolderOpen className={className} {...props} />;
    case "folder-plus":
      return <FolderPlus className={className} {...props} />;
    case "run":
    case "motion":
    case "🏃":
      return <Activity className={className} {...props} />;
    case "lightning":
    case "energy":
    case "⚡":
      return <Zap className={className} {...props} />;
    case "globe":
    case "earth":
    case "gravitation":
    case "🌍":
      return <Globe className={className} {...props} />;
    case "pin":
    case "📌":
      return <Pin className={className} {...props} />;
    case "chemistry":
    case "flask":
    case "🧪":
      return <FlaskConical className={className} {...props} />;
    case "book":
    case "books":
    case "📚":
      return <BookOpen className={className} {...props} />;
    case "flame":
    case "streak":
    case "🔥":
      return <Flame className={className} {...props} />;
    case "leaf":
    case "🌿":
      return <Leaf className={className} {...props} />;
    case "image":
    case "🖼️":
      return <Image className={className} {...props} />;
    case "file":
    case "document":
    case "📄":
    case "📑":
      return <FileText className={className} {...props} />;
    case "cards":
    case "flashcards":
    case "🃏":
      return <Layers className={className} {...props} />;
    case "quiz":
    case "question":
    case "help":
    case "❓":
      return <HelpCircle className={className} {...props} />;
    case "key":
    case "concept":
    case "🔑":
      return <KeyRound className={className} {...props} />;
    case "chart":
    case "diagram":
    case "📊":
      return <BarChart3 className={className} {...props} />;
    case "sparkles":
    case "ai":
    case "✨":
    case "✦":
      return <Sparkles className={className} {...props} />;
    case "trophy":
    case "celebrate":
    case "🎉":
      return <Trophy className={className} {...props} />;
    case "thumbsup":
    case "good":
    case "👍":
      return <ThumbsUp className={className} {...props} />;
    case "muscle":
    case "strong":
    case "💪":
      return <Award className={className} {...props} />;
    case "wifi-off":
    case "offline":
    case "📴":
      return <WifiOff className={className} {...props} />;
    case "lock":
    case "auth":
    case "🔐":
      return <Lock className={className} {...props} />;
    case "palette":
    case "color":
    case "🎨":
      return <Palette className={className} {...props} />;
    case "trash":
    case "delete":
    case "🗑️":
      return <Trash2 className={className} {...props} />;
    case "lightbulb":
    case "hint":
    case "💡":
      return <Lightbulb className={className} {...props} />;
    case "search":
    case "🔍":
      return <Search className={className} {...props} />;
    case "map-pin":
    case "location":
    case "📍":
      return <MapPin className={className} {...props} />;
    case "brain":
    case "smart":
    case "🧠":
      return <Brain className={className} {...props} />;
    case "chat":
    case "messages":
    case "💬":
      return <MessageSquare className={className} {...props} />;
    case "phone":
    case "mobile":
    case "📱":
      return <Smartphone className={className} {...props} />;
    case "plane":
    case "anywhere":
    case "✈️":
      return <Compass className={className} {...props} />;
    case "check":
    case "✓":
      return <Check className={className} {...props} />;
    case "close":
    case "x":
    case "✗":
      return <X className={className} {...props} />;
    case "hand":
    case "✋":
      return <Hand className={className} {...props} />;
    case "move":
    case "select":
    case "⊹":
      return <Move className={className} {...props} />;
    case "zoom-in":
    case "⊕":
      return <ZoomIn className={className} {...props} />;
    case "zoom-out":
    case "⊖":
      return <ZoomOut className={className} {...props} />;
    case "fullscreen":
    case "fit":
    case "⛶":
      return <Maximize2 className={className} {...props} />;
    case "rotate":
    case "🔄":
      return <RotateCw className={className} {...props} />;
    case "alert":
    case "warning":
    case "⚠️":
      return <AlertCircle className={className} {...props} />;
    case "play":
    case "start":
    case "🚀":
      return <Play className={className} {...props} />;
    default:
      return <FileText className={className} {...props} />;
  }
}

export {
  Camera,
  Atom,
  Calculator,
  Code2,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Activity,
  Zap,
  Globe,
  Pin,
  FlaskConical,
  BookOpen,
  Flame,
  Leaf,
  Image,
  Layers,
  HelpCircle,
  KeyRound,
  BarChart3,
  Sparkles,
  Trophy,
  ThumbsUp,
  Award,
  WifiOff,
  Lock,
  Palette,
  Trash2,
  Pencil,
  PenTool,
  Lightbulb,
  Search,
  MapPin,
  Brain,
  MessageSquare,
  Smartphone,
  Check,
  X,
  Compass,
  Move,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand,
  RotateCw,
  AlertCircle,
  Play,
  Share2,
  Copy,
  ChevronRight,
  ChevronLeft,
  Bell,
  User,
  Sliders,
};
