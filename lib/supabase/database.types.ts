export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      organization_domains: {
        Row: {
          id: string;
          organization_id: string;
          domain: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          domain: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          domain?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_domains_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          full_name: string;
          role: "student" | "instructor" | "admin";
          email_verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          full_name: string;
          role?: "student" | "instructor" | "admin";
          email_verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          full_name?: string;
          role?: "student" | "instructor" | "admin";
          email_verified?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      user_organizations: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_organizations_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_organizations_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          ip_address: string | null;
          user_agent: string | null;
          started_at: string;
          last_active_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          ip_address?: string | null;
          user_agent?: string | null;
          started_at?: string;
          last_active_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          started_at?: string;
          last_active_at?: string;
          ended_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      classrooms: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      classroom_members: {
        Row: {
          id: string;
          classroom_id: string;
          user_id: string;
          role: "student" | "instructor";
          joined_at: string;
        };
        Insert: {
          id?: string;
          classroom_id: string;
          user_id: string;
          role: "student" | "instructor";
          joined_at?: string;
        };
        Update: {
          id?: string;
          classroom_id?: string;
          user_id?: string;
          role?: "student" | "instructor";
          joined_at?: string;
        };
        Relationships: [];
      };
      problems: {
        Row: {
          id: string;
          title: string;
          difficulty: "easy" | "medium" | "hard";
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          difficulty: "easy" | "medium" | "hard";
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          difficulty?: "easy" | "medium" | "hard";
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      problem_languages: {
        Row: {
          id: string;
          problem_id: string;
          language: "c" | "java" | "python";
        };
        Insert: {
          id?: string;
          problem_id: string;
          language: "c" | "java" | "python";
        };
        Update: {
          id?: string;
          problem_id?: string;
          language?: "c" | "java" | "python";
        };
        Relationships: [];
      };
      classroom_problems: {
        Row: {
          id: string;
          classroom_id: string;
          problem_id: string;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          classroom_id: string;
          problem_id: string;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          classroom_id?: string;
          problem_id?: string;
          assigned_at?: string;
        };
        Relationships: [];
      };
      classroom_problem_languages: {
        Row: {
          id: string;
          classroom_problem_id: string;
          language: "c" | "java" | "python";
        };
        Insert: {
          id?: string;
          classroom_problem_id: string;
          language: "c" | "java" | "python";
        };
        Update: {
          id?: string;
          classroom_problem_id?: string;
          language?: "c" | "java" | "python";
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          classroom_id: string;
          submission_code_path: string;
          submission_data_file_path: string;
          language: "c" | "java" | "python";
          submitted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          problem_id: string;
          classroom_id: string;
          submission_code_path: string;
          submission_data_file_path: string;
          language: "c" | "java" | "python";
          submitted_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          problem_id?: string;
          classroom_id?: string;
          submission_code_path?: string;
          submission_data_file_path?: string;
          language?: "c" | "java" | "python";
          submitted_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      problem_language: "c" | "java" | "python";
      problem_difficulty: "easy" | "medium" | "hard";
    };
    CompositeTypes: Record<string, never>;
  };
};
