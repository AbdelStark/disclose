use anyhow::{anyhow, Result};
use crossterm::event::{self, Event, KeyCode};
use crossterm::execute;
use crossterm::terminal::{
    disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen,
};
use ratatui::backend::CrosstermBackend;
use ratatui::layout::{Alignment, Constraint, Direction, Layout};
use ratatui::style::{Color, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, List, ListItem, Paragraph};
use ratatui::Terminal;
use std::io::{self, Stdout};
use std::path::PathBuf;

use crate::commands::{
    attach_proof, export_bundle, init_workspace, publish_workspace, stamp_workspace, update_meter,
    ExportFormat, IncludeProof,
};
use crate::templates::{load_templates, Template};

struct TuiTerminal {
    terminal: Terminal<CrosstermBackend<Stdout>>,
}

impl TuiTerminal {
    fn new() -> Result<Self> {
        enable_raw_mode()?;
        let mut stdout = io::stdout();
        execute!(stdout, EnterAlternateScreen)?;
        let backend = CrosstermBackend::new(stdout);
        let terminal = Terminal::new(backend)?;
        Ok(Self { terminal })
    }

    fn finish(mut self) -> Result<()> {
        disable_raw_mode()?;
        execute!(self.terminal.backend_mut(), LeaveAlternateScreen)?;
        self.terminal.show_cursor()?;
        Ok(())
    }
}

fn draw_centered<'a>(
    terminal: &mut Terminal<CrosstermBackend<Stdout>>,
    title: &'a str,
    body: Vec<Line<'a>>,
) -> Result<()> {
    terminal.draw(|frame| {
        let size = frame.size();
        let block = Block::default().title(title).borders(Borders::ALL);
        let area = block.inner(size);
        frame.render_widget(block, size);
        let paragraph = Paragraph::new(body)
            .alignment(Alignment::Left)
            .block(Block::default().borders(Borders::NONE));
        frame.render_widget(paragraph, area);
    })?;
    Ok(())
}

fn read_text(
    terminal: &mut Terminal<CrosstermBackend<Stdout>>,
    title: &str,
    prompt: &str,
) -> Result<String> {
    let mut input = String::new();
    loop {
        terminal.draw(|frame| {
            let size = frame.size();
            let block = Block::default().title(title).borders(Borders::ALL);
            let inner = block.inner(size);
            frame.render_widget(block, size);

            let chunks = Layout::default()
                .direction(Direction::Vertical)
                .margin(2)
                .constraints([
                    Constraint::Length(2),
                    Constraint::Length(2),
                    Constraint::Min(1),
                ])
                .split(inner);

            frame.render_widget(Paragraph::new(prompt), chunks[0]);
            let input_line = Paragraph::new(input.as_str())
                .style(Style::default().fg(Color::Yellow))
                .block(Block::default().borders(Borders::ALL).title("Input"));
            frame.render_widget(input_line, chunks[1]);
        })?;

        if let Event::Key(key) = event::read()? {
            match key.code {
                KeyCode::Enter => break,
                KeyCode::Esc => return Err(anyhow!("Cancelled")),
                KeyCode::Backspace => {
                    input.pop();
                }
                KeyCode::Char(c) => {
                    input.push(c);
                }
                _ => {}
            }
        }
    }

    Ok(input.trim().to_string())
}

fn read_bool(
    terminal: &mut Terminal<CrosstermBackend<Stdout>>,
    title: &str,
    prompt: &str,
) -> Result<bool> {
    loop {
        draw_centered(
            terminal,
            title,
            vec![Line::from(prompt), Line::from("Press Y / N")],
        )?;
        if let Event::Key(key) = event::read()? {
            match key.code {
                KeyCode::Char('y') | KeyCode::Char('Y') => return Ok(true),
                KeyCode::Char('n') | KeyCode::Char('N') => return Ok(false),
                _ => {}
            }
        }
    }
}

fn select_template(
    terminal: &mut Terminal<CrosstermBackend<Stdout>>,
    templates: &[Template],
) -> Result<Template> {
    let mut selected = 0usize;
    loop {
        terminal.draw(|frame| {
            let size = frame.size();
            let block = Block::default()
                .title("Select Template")
                .borders(Borders::ALL);
            let inner = block.inner(size);
            frame.render_widget(block, size);

            let items: Vec<ListItem> = templates
                .iter()
                .enumerate()
                .map(|(index, template)| {
                    let style = if index == selected {
                        Style::default().fg(Color::Black).bg(Color::Yellow)
                    } else {
                        Style::default()
                    };
                    ListItem::new(Line::from(vec![
                        Span::styled(template.label.clone(), style),
                        Span::raw(format!(" ({})", template.slug)),
                    ]))
                })
                .collect();

            let list = List::new(items);
            frame.render_widget(list, inner);
        })?;

        if let Event::Key(key) = event::read()? {
            match key.code {
                KeyCode::Up => {
                    if selected > 0 {
                        selected -= 1;
                    }
                }
                KeyCode::Down => {
                    if selected + 1 < templates.len() {
                        selected += 1;
                    }
                }
                KeyCode::Enter => return Ok(templates[selected].clone()),
                KeyCode::Esc => return Err(anyhow!("Cancelled")),
                _ => {}
            }
        }
    }
}

pub fn run_tui(root: PathBuf) -> Result<()> {
    let mut terminal = TuiTerminal::new()?;

    let templates = load_templates()?;
    let template = select_template(&mut terminal.terminal, &templates)?;
    let title = read_text(&mut terminal.terminal, "Project Info", "Project title")?;
    let author = read_text(&mut terminal.terminal, "Project Info", "Author (optional)")?;

    let workspace_dir = if root.join("disclosure.json").exists() {
        root
    } else {
        root.join("disclose")
    };

    let workspace = init_workspace(
        workspace_dir,
        &template.slug,
        &title,
        if author.is_empty() {
            None
        } else {
            Some(author)
        },
        Vec::new(),
    )?;

    loop {
        let path = read_text(
            &mut terminal.terminal,
            "Attach Proof",
            "Proof file path (blank to continue)",
        )?;
        if path.is_empty() {
            break;
        }
        let proof_path = PathBuf::from(path);
        let _ = attach_proof(
            &workspace,
            vec![proof_path],
            None,
            None,
            Some(true),
            None,
            None,
        )?;
    }

    let human = read_text(
        &mut terminal.terminal,
        "Assistance Meter",
        "Human percent (0-100)",
    )?
    .parse::<i32>()
    .unwrap_or(70);
    let _ = update_meter(&workspace, Some(human), None, Vec::new(), false)?;

    let stamp = read_bool(
        &mut terminal.terminal,
        "Timestamp",
        "Create OpenTimestamps receipt?",
    )?;
    if stamp {
        let _ = stamp_workspace(&workspace, None, None, None, false, None)?;
    }

    let export_path = read_text(
        &mut terminal.terminal,
        "Export",
        "Export bundle path (default disclosure-bundle.zip)",
    )?;
    let bundle = if export_path.is_empty() {
        PathBuf::from("disclosure-bundle.zip")
    } else {
        PathBuf::from(export_path)
    };
    export_bundle(
        &workspace,
        bundle.clone(),
        IncludeProof::Hashes,
        true,
        ExportFormat::Zip,
    )?;

    let publish = read_bool(&mut terminal.terminal, "Publish", "Publish disclosure now?")?;
    if publish {
        let endpoint = read_text(
            &mut terminal.terminal,
            "Publish",
            "Endpoint (default http://localhost:3000)",
        )?;
        let endpoint = if endpoint.is_empty() {
            "http://localhost:3000".to_string()
        } else {
            endpoint
        };
        let runtime = tokio::runtime::Runtime::new()?;
        let _ = runtime.block_on(publish_workspace(&workspace, &endpoint, None, true))?;
    }

    draw_centered(
        &mut terminal.terminal,
        "Done",
        vec![Line::from("Disclosure saved. Press any key to exit.")],
    )?;
    let _ = event::read()?;

    terminal.finish()?;
    Ok(())
}
