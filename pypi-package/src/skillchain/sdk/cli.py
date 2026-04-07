"""
cli.py
======

Click CLI for the SkillChain SDK.

Commands::

    skillchain init [--passphrase]
    skillchain publish <path> [--price] [--license]
    skillchain discover [--domain] [--tags] [--min-trust] [--max-results]
    skillchain import <skill_id> [--skip-validation] [--target-dir]
    skillchain validate <skill_id>
    skillchain stake <amount> [--unstake]
    skillchain status
    skillchain trust <node_id>

All commands accept ``--network sepolia|mainnet`` to select the target chain.
"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path
from typing import Optional

import click

from .adapters import SUPPORTED_PLATFORMS, get_adapter
from .config import SkillChainConfig
from .exceptions import SkillChainError
from .user_profile import ProfileManager

logger = logging.getLogger(__name__)


def _get_node(network: Optional[str] = None):
    """Load config and create a SkillChainNode."""
    from .node import SkillChainNode

    config = SkillChainConfig.load(network=network)
    return SkillChainNode(config)


def _setup_logging(verbose: bool) -> None:
    """Configure logging based on verbosity."""
    level = logging.DEBUG if verbose else logging.WARNING
    logging.basicConfig(
        level=level,
        format="%(levelname)s  %(name)s  %(message)s",
    )


# -- CLI group -----------------------------------------------------------------

@click.group()
@click.option("--network", type=click.Choice(["sepolia", "mainnet"]), default=None,
              help="Target network (default: sepolia)")
@click.option("--verbose", "-v", is_flag=True, help="Enable verbose logging")
@click.pass_context
def cli(ctx: click.Context, network: Optional[str], verbose: bool) -> None:
    """SkillChain -- Decentralized AI Skill-Sharing Network."""
    ctx.ensure_object(dict)
    ctx.obj["network"] = network
    _setup_logging(verbose)


# -- init ----------------------------------------------------------------------

@cli.command()
@click.option("--passphrase", prompt=True, hide_input=True, confirmation_prompt=True,
              help="Passphrase for key encryption")
@click.option("--platform", type=click.Choice(SUPPORTED_PLATFORMS), default=None,
              help="AI platform for skill installation")
@click.pass_context
def init(ctx: click.Context, passphrase: str, platform: str | None) -> None:
    """Initialise SkillChain: generate keys, create config, register on-chain."""
    try:
        from rich.console import Console
        console = Console()
    except ImportError:
        console = None

    try:
        # Prompt for platform if not provided via flag
        if platform is None:
            platform = click.prompt(
                "AI platform",
                type=click.Choice(SUPPORTED_PLATFORMS),
                default="claude",
            )

        config = SkillChainConfig.load(network=ctx.obj.get("network"))
        config.agent_platform = platform
        config.save()

        adapter = get_adapter(platform)

        from .node import SkillChainNode
        node = SkillChainNode(config)
        node_id = node.register()

        # Install Claude Code skill template
        _install_skill_template()

        # Auto-install MCP server for Claude Code
        try:
            from .mcp_bridge.claude_settings import install_mcp_server, is_installed
            if not is_installed():
                install_mcp_server()
                if console:
                    console.print("  [cyan]MCP server:[/cyan] auto-configured for Claude Code")
                else:
                    click.echo("  MCP server: auto-configured for Claude Code")
        except Exception:
            pass  # Non-fatal — works without MCP too

        if console:
            console.print(f"\n[bold green]SkillChain initialised![/bold green]")
            console.print(f"  Node ID:    {node_id}")
            console.print(f"  Config:     {config.config_dir}")
            console.print(f"  Network:    {config.network}")
            console.print(f"  Platform:   {adapter.platform_name}")
            console.print(f"  Skills dir: {adapter.default_skills_dir}")
            console.print(f"  Wallet:     {node.wallet_address or '(not configured)'}")
        else:
            click.echo(f"\nSkillChain initialised!")
            click.echo(f"  Node ID:    {node_id}")
            click.echo(f"  Config:     {config.config_dir}")
            click.echo(f"  Platform:   {adapter.platform_name}")

        # Profile onboarding
        pm = ProfileManager(config_dir=config.config_dir)
        profile = pm.onboard()
        profile.ai_platform = platform
        pm.save(profile)

        # Auto-claim starter bonus
        try:
            tx = node.call_onboarding("claimStarter")
            if console:
                console.print(f"  [gold1]Starter bonus:[/gold1] +10 TRUST claimed! (tx: {tx[:10]}...)")
            else:
                click.echo(f"  Starter bonus: +10 TRUST claimed!")
        except Exception:
            # Non-fatal — pool may be empty or not deployed yet
            pass

        # Show recommendations
        _show_recommendations(pm, adapter)

    except SkillChainError as exc:
        click.echo(f"Error: {exc}", err=True)
        sys.exit(1)


# -- publish -------------------------------------------------------------------

@cli.command()
@click.argument("path", type=click.Path(exists=True))
@click.option("--price", default=0, type=int, help="Price in wei (0 = free)")
@click.option("--license", "license_type", default="MIT", help="License identifier")
@click.option("--domain", default="general", help="Skill domain")
@click.option("--tags", default="", help="Comma-separated tags")
@click.option("--auto", is_flag=True, hidden=True, help="Auto mode (from hooks)")
@click.pass_context
def publish(ctx: click.Context, path: str, price: int, license_type: str,
            domain: str, tags: str, auto: bool) -> None:
    """Package, upload, and register a skill on SkillChain."""
    try:
        from rich.console import Console
        from rich.progress import Progress
        console = Console()
    except ImportError:
        console = None

    try:
        from .skill_packer import SkillManifest

        skill_path = Path(path)
        node = _get_node(ctx.obj.get("network"))

        manifest = SkillManifest(
            name=skill_path.stem,
            version="1.0.0",
            domain=domain,
            description=f"Skill: {skill_path.stem}",
            tags=[t.strip() for t in tags.split(",") if t.strip()],
            price=price,
            license=license_type,
            author_node_id=node.node_id,
        )

        if console:
            with Progress() as progress:
                task = progress.add_task("Publishing skill...", total=3)
                progress.update(task, advance=1, description="Packing .skillpack...")
                skill_id = node.publish_skill(
                    skill_path, manifest=manifest, price=price, license_type=license_type,
                )
                progress.update(task, advance=2, description="Done!")

            console.print(f"\n[bold green]Published![/bold green] Skill ID: {skill_id}")
        else:
            skill_id = node.publish_skill(
                skill_path, manifest=manifest, price=price, license_type=license_type,
            )
            click.echo(f"Published! Skill ID: {skill_id}")

    except SkillChainError as exc:
        click.echo(f"Error: {exc}", err=True)
        sys.exit(1)


# -- discover ------------------------------------------------------------------

@cli.command()
@click.option("--domain", default=None, help="Filter by domain")
@click.option("--tags", default=None, help="Comma-separated tags to filter")
@click.option("--min-trust", default=0.0, type=float, help="Minimum owner trust score")
@click.option("--max-results", default=20, type=int, help="Maximum results")
@click.option("--query", "-q", default=None, help="Free-text search query")
@click.pass_context
def discover(ctx: click.Context, domain: Optional[str], tags: Optional[str],
             min_trust: float, max_results: int, query: Optional[str]) -> None:
    """Search for skills on the SkillChain network."""
    try:
        from rich.console import Console
        from rich.table import Table
        console = Console()
    except ImportError:
        console = None

    try:
        node = _get_node(ctx.obj.get("network"))
        tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else None

        results = node.discover(
            domain=domain,
            tags=tag_list,
            min_trust=min_trust,
            max_results=max_results,
            query=query,
        )

        if not results:
            click.echo("No skills found matching your criteria.")
            return

        if console:
            table = Table(title="SkillChain Skills", show_lines=True)
            table.add_column("ID", style="cyan", justify="right")
            table.add_column("Name", style="bold")
            table.add_column("Domain", style="green")
            table.add_column("Tags")
            table.add_column("Price", justify="right")
            table.add_column("Validations", justify="right")
            table.add_column("Success", justify="right", style="yellow")
            table.add_column("Trust", justify="right")

            for s in results:
                table.add_row(
                    str(s.skill_id),
                    s.name,
                    s.domain,
                    ", ".join(s.tags[:3]),
                    f"{s.price}" if s.price else "Free",
                    str(s.validation_count),
                    f"{s.success_rate:.0%}",
                    f"{s.owner_trust:.2f}",
                )

            console.print(table)
        else:
            for s in results:
                click.echo(
                    f"  [{s.skill_id}] {s.name} ({s.domain}) "
                    f"validations={s.validation_count} success={s.success_rate:.0%}"
                )

    except SkillChainError as exc:
        click.echo(f"Error: {exc}", err=True)
        sys.exit(1)


# -- import --------------------------------------------------------------------

@cli.command("import")
@click.argument("skill_id", type=int)
@click.option("--skip-validation", is_flag=True, help="Skip shadow validation")
@click.option("--target-dir", type=click.Path(), default=None,
              help="Install directory (default: ~/.claude/skills/)")
@click.pass_context
def import_skill(ctx: click.Context, skill_id: int, skip_validation: bool,
                 target_dir: Optional[str]) -> None:
    """Download, validate, and install a skill from SkillChain."""
    try:
        from rich.console import Console
        console = Console()
    except ImportError:
        console = None

    try:
        config = SkillChainConfig.load(network=ctx.obj.get("network"))
        adapter = get_adapter(config.agent_platform)

        from .node import SkillChainNode
        node = SkillChainNode(config)
        target = Path(target_dir) if target_dir else None

        installed_path = node.import_skill(
            skill_id,
            skip_validation=skip_validation,
            target_dir=target,
        )

        if console:
            console.print(f"\n[bold green]Imported![/bold green]")
            console.print(f"  Platform:     {adapter.platform_name}")
            console.print(f"  Installed to: {installed_path}")
        else:
            click.echo(f"Imported! Platform: {adapter.platform_name}, installed to: {installed_path}")

    except SkillChainError as exc:
        click.echo(f"Error: {exc}", err=True)
        sys.exit(1)


# -- validate ------------------------------------------------------------------

@cli.command()
@click.argument("skill_id", type=int)
@click.pass_context
def validate(ctx: click.Context, skill_id: int) -> None:
    """Run 5 shadow validation runs on a skill and report results on-chain."""
    try:
        from rich.console import Console
        from rich.table import Table
        console = Console()
    except ImportError:
        console = None

    try:
        node = _get_node(ctx.obj.get("network"))
        result = node.validate_skill(skill_id)

        if console:
            status = "[bold green]PASSED[/bold green]" if result.passed else "[bold red]FAILED[/bold red]"
            console.print(f"\nValidation: {status}")

            table = Table(title="Shadow Runs")
            table.add_column("Run", justify="right")
            table.add_column("Similarity", justify="right")
            table.add_column("Time (s)", justify="right")
            table.add_column("Error")

            for i in range(result.shadow_count):
                sim = result.similarity_scores[i] if i < len(result.similarity_scores) else 0.0
                elapsed = result.execution_times[i] if i < len(result.execution_times) else 0.0
                err = result.errors[i] if i < len(result.errors) else ""
                table.add_row(
                    str(i + 1),
                    f"{sim:.3f}",
                    f"{elapsed:.2f}",
                    err or "-",
                )

            console.print(table)
            console.print(f"Match rate: {result.match_rate:.0%} ({result.match_count}/{result.shadow_count})")
            console.print(f"Avg similarity: {result.avg_similarity:.3f}")
        else:
            click.echo(f"Validation: {'PASSED' if result.passed else 'FAILED'}")
            click.echo(f"Match rate: {result.match_rate:.0%} ({result.match_count}/{result.shadow_count})")

    except SkillChainError as exc:
        click.echo(f"Error: {exc}", err=True)
        sys.exit(1)


# -- stake ---------------------------------------------------------------------

@cli.command()
@click.argument("amount", type=float)
@click.option("--unstake", is_flag=True, help="Unstake instead of stake")
@click.pass_context
def stake(ctx: click.Context, amount: float, unstake: bool) -> None:
    """Stake or unstake ETH to change your node tier."""
    try:
        node = _get_node(ctx.obj.get("network"))
        amount_wei = int(amount * 1e18)

        if unstake:
            tx_hash = node.unstake(amount_wei)
            click.echo(f"Unstaked {amount} ETH. TX: {tx_hash}")
        else:
            tx_hash = node.stake(amount_wei)
            click.echo(f"Staked {amount} ETH. TX: {tx_hash}")

    except SkillChainError as exc:
        click.echo(f"Error: {exc}", err=True)
        sys.exit(1)


# -- status --------------------------------------------------------------------

@cli.command()
@click.pass_context
def status(ctx: click.Context) -> None:
    """Show node status, balance, trust, and tier."""
    try:
        from rich.console import Console
        from rich.panel import Panel
        console = Console()
    except ImportError:
        console = None

    try:
        config = SkillChainConfig.load(network=ctx.obj.get("network"))
        adapter = get_adapter(config.agent_platform)

        from .node import SkillChainNode
        node = SkillChainNode(config)
        info = node.status()

        if console:
            lines = [
                f"[cyan]Node ID:[/cyan]       {info.get('node_id', 'Not registered')}",
                f"[cyan]Wallet:[/cyan]        {info.get('wallet_address', 'Not configured')}",
                f"[cyan]Network:[/cyan]       {info.get('network', 'sepolia')}",
                f"[cyan]Platform:[/cyan]      {adapter.platform_name}",
                f"[cyan]Skills Dir:[/cyan]    {adapter.default_skills_dir}",
                f"[cyan]Balance:[/cyan]       {info.get('balance_eth', 0):.6f} ETH",
                f"[cyan]Trust Score:[/cyan]   {info.get('trust_score', 0):.4f}",
                f"[cyan]Staking Tier:[/cyan]  {info.get('staking_tier', 0)}",
                f"[cyan]Config Dir:[/cyan]    {info.get('config_dir', '')}",
                f"[cyan]Domains:[/cyan]       {', '.join(info.get('domain_tags', [])) or 'None'}",
            ]
            console.print(Panel("\n".join(lines), title="SkillChain Node Status", border_style="green"))
        else:
            info["agent_platform"] = config.agent_platform
            info["skills_dir"] = str(adapter.default_skills_dir)
            click.echo(json.dumps(info, indent=2, default=str))

    except SkillChainError as exc:
        click.echo(f"Error: {exc}", err=True)
        sys.exit(1)


# -- trust ---------------------------------------------------------------------

@cli.command()
@click.argument("node_id")
@click.pass_context
def trust(ctx: click.Context, node_id: str) -> None:
    """Show trust details for a specific node."""
    try:
        from rich.console import Console
        console = Console()
    except ImportError:
        console = None

    try:
        node = _get_node(ctx.obj.get("network"))
        score = node.get_trust(node_id)

        if console:
            color = "green" if score >= 0.7 else "yellow" if score >= 0.4 else "red"
            console.print(f"\nNode: [bold]{node_id}[/bold]")
            console.print(f"Trust Score: [{color}]{score:.4f}[/{color}]")

            if score >= 0.8:
                console.print("[green]Tier: HIGH TRUST[/green]")
            elif score >= 0.5:
                console.print("[yellow]Tier: MODERATE TRUST[/yellow]")
            else:
                console.print("[red]Tier: LOW TRUST[/red]")
        else:
            click.echo(f"Node: {node_id}")
            click.echo(f"Trust: {score:.4f}")

    except SkillChainError as exc:
        click.echo(f"Error: {exc}", err=True)
        sys.exit(1)


# -- platforms -----------------------------------------------------------------

@cli.command()
def platforms() -> None:
    """List supported AI platforms and their skill install locations."""
    try:
        from rich.console import Console
        from rich.table import Table
        console = Console()
    except ImportError:
        console = None

    if console:
        table = Table(title="Supported AI Platforms", show_lines=True)
        table.add_column("Platform", style="cyan")
        table.add_column("Name", style="bold")
        table.add_column("Skills Directory")
        table.add_column("Format")

        formats = {
            "claude": ".md (markdown)",
            "gpt": ".json (custom instruction)",
            "gemini": ".json (system instruction)",
            "cursor": ".mdc (Cursor rule)",
            "generic": ".md (markdown)",
        }

        for key in SUPPORTED_PLATFORMS:
            adapter = get_adapter(key)
            table.add_row(
                key,
                adapter.platform_name,
                str(adapter.default_skills_dir),
                formats.get(key, "unknown"),
            )

        console.print(table)
    else:
        for key in SUPPORTED_PLATFORMS:
            adapter = get_adapter(key)
            click.echo(f"  {key:10s}  {str(adapter.default_skills_dir)}")


# -- ipfs (command group) ------------------------------------------------------

@cli.group()
def ipfs() -> None:
    """IPFS configuration and management."""


@ipfs.command("status")
@click.pass_context
def ipfs_status(ctx: click.Context) -> None:
    """Check IPFS connection status."""
    from .ipfs_client import IPFSClient
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    client = IPFSClient(
        provider=config.ipfs_provider,
        api_key=config.pinata_api_key,
        secret_key=config.pinata_secret_key,
        gateway=config.ipfs_gateway,
    )

    available = client.is_available()
    status_str = click.style("connected", fg="green") if available else click.style("disconnected", fg="red")
    click.echo(f"Provider:  {client.provider}")
    click.echo(f"Gateway:   {client._gateway}")
    click.echo(f"Status:    {status_str}")
    click.echo(f"Can upload: {'yes' if client.can_upload else 'no (read-only)'}")

    if available and client.can_upload:
        count = client.pin_count()
        if count >= 0:
            click.echo(f"Pin count: {count}")


@ipfs.command("upload")
@click.argument("path", type=click.Path(exists=True))
@click.pass_context
def ipfs_upload(ctx: click.Context, path: str) -> None:
    """Upload a file to IPFS and return its CID."""
    from .ipfs_client import IPFSClient
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    client = IPFSClient(
        provider=config.ipfs_provider,
        api_key=config.pinata_api_key,
        secret_key=config.pinata_secret_key,
        gateway=config.ipfs_gateway,
    )

    p = Path(path)
    try:
        if p.is_dir():
            cid = client.upload_directory(p)
        else:
            cid = client.upload_file(p)
        click.echo(f"Uploaded: {cid}")
        click.echo(f"Gateway:  {client._gateway}{cid}")
    except SkillChainError as exc:
        click.echo(f"Upload failed: {exc}", err=True)
        sys.exit(1)


@ipfs.command("download")
@click.argument("cid")
@click.option("--output", "-o", type=click.Path(), default=None, help="Output file path")
@click.pass_context
def ipfs_download(ctx: click.Context, cid: str, output: str | None) -> None:
    """Download content from IPFS by CID."""
    from .ipfs_client import IPFSClient
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    client = IPFSClient(
        provider=config.ipfs_provider,
        api_key=config.pinata_api_key,
        secret_key=config.pinata_secret_key,
        gateway=config.ipfs_gateway,
    )

    try:
        if output:
            out_path = Path(output)
            client.download_to(cid, out_path)
            click.echo(f"Downloaded to: {out_path}")
        else:
            data = client.download(cid)
            click.echo(f"Downloaded {len(data)} bytes (CID: {cid})")
            # Write to stdout if binary, show size otherwise
            if len(data) < 4096:
                try:
                    click.echo(data.decode("utf-8"))
                except UnicodeDecodeError:
                    click.echo(f"(binary content, use -o to save to file)")
            else:
                click.echo(f"(large content, use -o to save to file)")
    except SkillChainError as exc:
        click.echo(f"Download failed: {exc}", err=True)
        sys.exit(1)


@ipfs.command("pin")
@click.argument("cid")
@click.pass_context
def ipfs_pin(ctx: click.Context, cid: str) -> None:
    """Pin content by CID to ensure persistence."""
    from .ipfs_client import IPFSClient
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    client = IPFSClient(
        provider=config.ipfs_provider,
        api_key=config.pinata_api_key,
        secret_key=config.pinata_secret_key,
        gateway=config.ipfs_gateway,
    )

    if client.pin(cid):
        click.echo(f"Pinned: {cid}")
    else:
        click.echo(f"Pin failed for: {cid}", err=True)
        sys.exit(1)


@ipfs.command("unpin")
@click.argument("cid")
@click.pass_context
def ipfs_unpin(ctx: click.Context, cid: str) -> None:
    """Unpin content by CID."""
    from .ipfs_client import IPFSClient
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    client = IPFSClient(
        provider=config.ipfs_provider,
        api_key=config.pinata_api_key,
        secret_key=config.pinata_secret_key,
        gateway=config.ipfs_gateway,
    )

    if client.unpin(cid):
        click.echo(f"Unpinned: {cid}")
    else:
        click.echo(f"Unpin failed for: {cid}", err=True)
        sys.exit(1)


# -- state (command group) -----------------------------------------------------

@cli.group()
def state() -> None:
    """Manage persistent skill state."""


@state.command("list")
def state_list() -> None:
    """Show all skills with persisted state."""
    from .skill_state import SkillStateStore

    try:
        from rich.console import Console
        from rich.table import Table
        console = Console()
    except ImportError:
        console = None

    store = SkillStateStore()
    skills = store.list_skills_with_state()

    if not skills:
        click.echo("No skills have persisted state.")
        return

    if console:
        table = Table(title="Skills with Persisted State", show_lines=True)
        table.add_column("Skill", style="cyan")
        table.add_column("Runs", justify="right")
        table.add_column("Last Run", style="dim")

        for name in sorted(skills):
            st = store.get_state(name)
            table.add_row(name, str(st.run_count), st.last_run_at or "-")

        console.print(table)
    else:
        for name in sorted(skills):
            st = store.get_state(name)
            click.echo(f"  {name:30s}  runs={st.run_count}  last={st.last_run_at or '-'}")


@state.command("show")
@click.argument("skill_name")
def state_show(skill_name: str) -> None:
    """Show current state for a skill."""
    from .skill_state import SkillStateStore

    try:
        from rich.console import Console
        from rich.panel import Panel
        console = Console()
    except ImportError:
        console = None

    store = SkillStateStore()
    st = store.get_state(skill_name)

    if st.run_count == 0 and not st.last_run:
        click.echo(f"No state found for '{skill_name}'.")
        return

    data_keys = list(st.accumulated_data.keys()) if st.accumulated_data else []

    if console:
        lines = [
            f"[cyan]Skill:[/cyan]          {skill_name}",
            f"[cyan]Run Count:[/cyan]      {st.run_count}",
            f"[cyan]First Run:[/cyan]      {st.first_run or '-'}",
            f"[cyan]Last Run:[/cyan]       {st.last_run_at or '-'}",
            f"[cyan]Data Keys:[/cyan]      {', '.join(data_keys) or 'None'}",
        ]
        if st.last_run:
            lines.append(f"[cyan]Last Status:[/cyan]    {st.last_run.status}")
            lines.append(f"[cyan]Last Pattern:[/cyan]   {st.last_run.execution_pattern}")
            phase_names = [p.phase for p in st.last_run.phases]
            lines.append(f"[cyan]Last Phases:[/cyan]    {', '.join(phase_names) or 'None'}")

        console.print(Panel("\n".join(lines), title=f"State: {skill_name}", border_style="green"))
    else:
        click.echo(f"Skill:       {skill_name}")
        click.echo(f"Run Count:   {st.run_count}")
        click.echo(f"First Run:   {st.first_run or '-'}")
        click.echo(f"Last Run:    {st.last_run_at or '-'}")
        click.echo(f"Data Keys:   {', '.join(data_keys) or 'None'}")
        if st.last_run:
            click.echo(f"Last Status: {st.last_run.status}")


@state.command("history")
@click.argument("skill_name")
@click.option("--limit", "-n", default=10, type=int, help="Number of runs to show")
def state_history(skill_name: str, limit: int) -> None:
    """Show run history for a skill."""
    from .skill_state import SkillStateStore

    try:
        from rich.console import Console
        from rich.table import Table
        console = Console()
    except ImportError:
        console = None

    store = SkillStateStore()
    history = store.get_run_history(skill_name, limit=limit)

    if not history:
        click.echo(f"No run history for '{skill_name}'.")
        return

    if console:
        table = Table(title=f"Run History: {skill_name}", show_lines=True)
        table.add_column("#", justify="right")
        table.add_column("Started", style="dim")
        table.add_column("Status")
        table.add_column("Pattern")
        table.add_column("Phases", justify="right")

        for i, run in enumerate(history, 1):
            status_style = "green" if run.get("status") == "completed" else "red"
            table.add_row(
                str(i),
                run.get("started_at", "-"),
                f"[{status_style}]{run.get('status', '?')}[/{status_style}]",
                run.get("execution_pattern", "-"),
                str(len(run.get("phases", []))),
            )

        console.print(table)
    else:
        for i, run in enumerate(history, 1):
            click.echo(
                f"  {i}. {run.get('started_at', '-')}  "
                f"status={run.get('status', '?')}  "
                f"phases={len(run.get('phases', []))}"
            )


# -- chain (command group) -----------------------------------------------------

@cli.group()
def chain() -> None:
    """Compose and manage skill chains (pipelines)."""


def _chains_dir() -> Path:
    """Default directory for saved chains."""
    d = Path.home() / ".skillchain" / "chains"
    d.mkdir(parents=True, exist_ok=True)
    return d


@chain.command("create")
@click.argument("name")
def chain_create(name: str) -> None:
    """Interactively create a new skill chain."""
    from .skill_chain import SkillChain

    chain_obj = SkillChain(name)
    description = click.prompt("Chain description", default="")
    chain_obj.description = description

    click.echo("Add steps (empty skill name to finish):")
    while True:
        skill_name = click.prompt("  Skill name", default="")
        if not skill_name:
            break
        alias = click.prompt("  Alias", default=skill_name)
        deps_str = click.prompt("  Depends on (comma-separated aliases)", default="")
        deps = [d.strip() for d in deps_str.split(",") if d.strip()] if deps_str else None
        try:
            chain_obj.add(skill_name, alias=alias, depends_on=deps)
            click.echo(f"    Added: {alias}")
        except Exception as exc:
            click.echo(f"    Error: {exc}", err=True)

    if not chain_obj._steps:
        click.echo("No steps added. Chain not saved.")
        return

    errors = chain_obj.validate()
    if errors:
        click.echo("Validation errors:")
        for e in errors:
            click.echo(f"  - {e}")
        return

    out_path = _chains_dir() / f"{name}.chain.json"
    chain_obj.save(out_path)
    click.echo(f"Chain saved to {out_path}")


@chain.command("run")
@click.argument("chain_file", type=click.Path(exists=True))
@click.option("--context", "-c", default=None, help="Initial context as JSON string")
@click.option("--no-fail-fast", is_flag=True, help="Continue on step failure")
@click.option("--dry-run", is_flag=True, help="Validate and echo context without calling LLM")
@click.option("--model", default=None, help="Override Claude model (e.g. claude-sonnet-4-6-20250514)")
@click.option("--verbose", "-v", is_flag=True, help="Print prompt/response details per step")
def chain_run(chain_file: str, context: str | None, no_fail_fast: bool,
              dry_run: bool, model: str | None, verbose: bool) -> None:
    """Execute a saved skill chain.

    By default, each step is sent to Claude for real execution.
    Use --dry-run to test chain structure without calling the LLM.
    """
    from .skill_chain import SkillChain

    try:
        from rich.console import Console
        from rich.table import Table
        console = Console()
    except ImportError:
        console = None

    try:
        chain_obj = SkillChain.load(Path(chain_file))

        if not dry_run:
            from .llm_executor import LLMStepExecutor
            executor = LLMStepExecutor(model=model, verbose=verbose)
            chain_obj.set_executor(executor)
            if console:
                console.print(f"[dim]Executor: LLM ({executor._model})[/dim]")
            else:
                click.echo(f"Executor: LLM ({executor._model})")

        initial = json.loads(context) if context else {}
        result = chain_obj.execute(initial_context=initial, fail_fast=not no_fail_fast)

        if console:
            status = "[bold green]SUCCESS[/bold green]" if result.success else "[bold red]FAILED[/bold red]"
            console.print(f"\nChain: {result.chain_name}  {status}")
            console.print(f"Duration: {result.total_duration_ms:.1f}ms")

            table = Table(title="Steps", show_lines=True)
            table.add_column("Alias", style="cyan")
            table.add_column("Skill")
            table.add_column("Status")
            table.add_column("Duration", justify="right")

            for step in result.steps:
                style = "green" if step.status == "completed" else "red" if step.status == "failed" else "yellow"
                table.add_row(
                    step.alias,
                    step.skill_name,
                    f"[{style}]{step.status}[/{style}]",
                    f"{step.duration_ms:.1f}ms",
                )
            console.print(table)
        else:
            click.echo(f"Chain: {result.chain_name}  {'SUCCESS' if result.success else 'FAILED'}")
            click.echo(f"Duration: {result.total_duration_ms:.1f}ms")
            for step in result.steps:
                click.echo(f"  {step.alias}: {step.status} ({step.duration_ms:.1f}ms)")

        # Gamification hooks
        _record_gamification(result, console)

    except SkillChainError as exc:
        click.echo(f"Error: {exc}", err=True)
        sys.exit(1)


@chain.command("validate")
@click.argument("chain_file", type=click.Path(exists=True))
def chain_validate(chain_file: str) -> None:
    """Validate a chain definition for errors."""
    from .skill_chain import SkillChain

    try:
        chain_obj = SkillChain.load(Path(chain_file))
        errors = chain_obj.validate()
        if errors:
            click.echo("Validation errors:")
            for e in errors:
                click.echo(f"  - {e}")
            sys.exit(1)
        else:
            click.echo(f"Chain '{chain_obj.name}' is valid ({len(chain_obj._steps)} steps).")
    except SkillChainError as exc:
        click.echo(f"Error: {exc}", err=True)
        sys.exit(1)


@chain.command("visualize")
@click.argument("chain_file", type=click.Path(exists=True))
def chain_visualize(chain_file: str) -> None:
    """Print ASCII DAG visualisation of a chain."""
    from .skill_chain import SkillChain

    try:
        chain_obj = SkillChain.load(Path(chain_file))
        click.echo(chain_obj.visualize())
    except SkillChainError as exc:
        click.echo(f"Error: {exc}", err=True)
        sys.exit(1)


@chain.command("export")
@click.argument("chain_file", type=click.Path(exists=True))
@click.option("--output", "-o", type=click.Path(), default=".",
              help="Output directory for .skillpack")
def chain_export(chain_file: str, output: str) -> None:
    """Export a chain as a publishable .skillpack."""
    from .skill_chain import SkillChain

    try:
        chain_obj = SkillChain.load(Path(chain_file))
        pack_dir = chain_obj.to_skillpack(Path(output))
        click.echo(f"Exported to {pack_dir}")
    except SkillChainError as exc:
        click.echo(f"Error: {exc}", err=True)
        sys.exit(1)


@chain.command("list")
def chain_list() -> None:
    """List saved chains in ~/.skillchain/chains/."""
    from .skill_chain import SkillChain

    try:
        from rich.console import Console
        from rich.table import Table
        console = Console()
    except ImportError:
        console = None

    chains_dir = _chains_dir()
    files = sorted(chains_dir.glob("*.chain.json"))

    if not files:
        click.echo("No saved chains found.")
        return

    if console:
        table = Table(title="Saved Chains", show_lines=True)
        table.add_column("Name", style="cyan")
        table.add_column("Steps", justify="right")
        table.add_column("Description")
        table.add_column("File", style="dim")

        for f in files:
            try:
                c = SkillChain.load(f)
                table.add_row(c.name, str(len(c._steps)), c.description[:60] or "-", f.name)
            except Exception:
                table.add_row("?", "?", "Error loading", f.name)

        console.print(table)
    else:
        for f in files:
            try:
                c = SkillChain.load(f)
                click.echo(f"  {c.name:30s}  steps={len(c._steps)}  {c.description[:40] or '-'}")
            except Exception:
                click.echo(f"  {f.name:30s}  (error loading)")


# -- state (continued) --------------------------------------------------------

@state.command("clear")
@click.argument("skill_name")
@click.option("--yes", "-y", is_flag=True, help="Skip confirmation")
def state_clear(skill_name: str, yes: bool) -> None:
    """Clear all persisted state for a skill."""
    from .skill_state import SkillStateStore

    store = SkillStateStore()
    st = store.get_state(skill_name)

    if st.run_count == 0 and not st.last_run:
        click.echo(f"No state found for '{skill_name}'.")
        return

    if not yes:
        click.confirm(
            f"Clear all state for '{skill_name}' ({st.run_count} runs)?",
            abort=True,
        )

    store.clear_state(skill_name)
    click.echo(f"State cleared for '{skill_name}'.")


# -- do (plain-English chain discovery + run) ---------------------------------

@cli.command("do")
@click.argument("query")
@click.option("--context", "-c", default=None, help="Initial context as JSON string")
@click.option("--yes", "-y", is_flag=True, help="Skip confirmation and run the best match")
@click.option("--model", default=None, help="Override Claude model")
@click.option("--dry-run", is_flag=True, help="Find the chain but don't execute it")
@click.option("--top", "-n", default=5, help="Number of matches to show")
def do_query(query: str, context: str | None, yes: bool, model: str | None,
             dry_run: bool, top: int) -> None:
    """Find and run a skill chain from plain English.

    Describe what you need in your own words::

        skillchain do "I'm scared of AI and crypto"
        skillchain do "help me find a job"
        skillchain do "I need to move to a new city"
        skillchain do "I want to start a side business"
        skillchain do "plan my retirement" -y

    Use -y to auto-run the best match without confirmation.
    """
    from .chain_matcher import ChainMatcher
    from .skill_chain import SkillChain

    try:
        from rich.console import Console
        from rich.table import Table
        from rich.panel import Panel
        console = Console()
    except ImportError:
        console = None

    # Load all chains from marketplace
    chains_path = Path(__file__).resolve().parent.parent / "marketplace" / "chains"
    chain_files = sorted(chains_path.glob("*.chain.json")) if chains_path.exists() else []

    if not chain_files:
        click.echo("No chains found in marketplace.", err=True)
        sys.exit(1)

    chains = []
    for f in chain_files:
        try:
            chains.append(json.loads(f.read_text(encoding="utf-8")))
        except Exception:
            continue

    matcher = ChainMatcher(chains)
    matches = matcher.match(query, top_k=top)

    if not matches:
        click.echo("No chains match your query. Try different words.")
        return

    best = matches[0]

    # Display results
    if console:
        console.print(f'\n[bold]Query:[/bold] "{query}"\n')

        # Best match
        console.print(Panel(
            f"[bold cyan]{best.chain_name}[/bold cyan]\n\n"
            f"{best.description}\n\n"
            f"[dim]Skills: {' -> '.join(best.skills)}[/dim]\n"
            f"[dim]Steps: {best.step_count} | Score: {best.score} | {best.match_reason}[/dim]",
            title="[bold green]Best Match[/bold green]",
            border_style="green",
        ))

        # Other matches
        if len(matches) > 1:
            table = Table(title="Other Matches", show_lines=True)
            table.add_column("#", style="dim", width=3)
            table.add_column("Chain", style="cyan")
            table.add_column("Description")
            table.add_column("Score", justify="right")

            for i, m in enumerate(matches[1:], 2):
                desc = m.description[:80] + "..." if len(m.description) > 80 else m.description
                table.add_row(str(i), m.chain_name, desc, str(m.score))
            console.print(table)
    else:
        click.echo(f'\nQuery: "{query}"\n')
        click.echo(f"Best match: {best.chain_name} (score: {best.score})")
        click.echo(f"  {best.description}")
        click.echo(f"  Skills: {' -> '.join(best.skills)}")
        if len(matches) > 1:
            click.echo("\nOther matches:")
            for i, m in enumerate(matches[1:], 2):
                click.echo(f"  {i}. {m.chain_name} ({m.score}) — {m.description[:60]}")

    if dry_run:
        click.echo("\n(dry-run mode — not executing)")
        return

    # Confirm and run
    if not yes:
        if not click.confirm(f"\nRun '{best.chain_name}'?", default=True):
            click.echo("Cancelled.")
            return

    # Find chain data and execute
    chain_data = None
    for cd in chains:
        if cd.get("name") == best.chain_name:
            chain_data = cd
            break

    if not chain_data:
        click.echo(f"Error: chain '{best.chain_name}' data not found.", err=True)
        sys.exit(1)

    chain_obj = SkillChain.from_dict(chain_data)

    try:
        from .llm_executor import LLMStepExecutor
        executor = LLMStepExecutor(model=model)
        chain_obj.set_executor(executor)
        model_name = executor._model
    except Exception as exc:
        click.echo(f"Warning: LLM executor unavailable ({exc}), using dry-run mode.", err=True)
        model_name = "echo"

    if console:
        console.print(f"\n[dim]Running {best.chain_name} ({best.step_count} steps, model: {model_name})...[/dim]\n")
    else:
        click.echo(f"\nRunning {best.chain_name} ({best.step_count} steps)...\n")

    initial = json.loads(context) if context else {}
    result = chain_obj.execute(initial_context=initial, fail_fast=True)

    # Display results
    if console:
        from rich.table import Table as RichTable
        status = "[bold green]SUCCESS[/bold green]" if result.success else "[bold red]FAILED[/bold red]"
        console.print(f"Chain: {result.chain_name}  {status}")
        console.print(f"Duration: {result.total_duration_ms:.0f}ms\n")

        table = RichTable(title="Steps", show_lines=True)
        table.add_column("Step", style="cyan")
        table.add_column("Skill")
        table.add_column("Status")
        table.add_column("Time", justify="right")

        for step in result.steps:
            style = "green" if step.status == "completed" else "red" if step.status == "failed" else "yellow"
            table.add_row(
                step.alias,
                step.skill_name,
                f"[{style}]{step.status}[/{style}]",
                f"{step.duration_ms:.0f}ms",
            )
        console.print(table)
    else:
        click.echo(f"{'SUCCESS' if result.success else 'FAILED'} ({result.total_duration_ms:.0f}ms)")
        for step in result.steps:
            click.echo(f"  {step.alias}: {step.status} ({step.duration_ms:.0f}ms)")

    # Gamification hooks
    _record_gamification(result, console)


# -- gamification helper -------------------------------------------------------

def _record_gamification(result, console) -> None:
    """Record execution results in the gamification engine."""
    try:
        from .gamification import GamificationEngine
        engine = GamificationEngine()
        all_unlocked = []

        for step in result.steps:
            if step.status == "completed":
                unlocked = engine.record_skill_run(step.skill_name)
                all_unlocked.extend(unlocked)

        if result.success:
            unlocked = engine.record_chain_run(
                result.chain_name, len(result.steps), result.total_duration_ms
            )
            all_unlocked.extend(unlocked)

        card = engine.get_trainer_card()

        # Print gamification summary
        if console:
            console.print(f"\n[dim]+{card['xp']} XP | Level {card['level']} {card['title']} | Streak: {card['streak']}d[/dim]")
            for ach in all_unlocked:
                console.print(f"[bold gold1]Achievement Unlocked: {ach.name}[/bold gold1] -- {ach.description} (+{ach.xp_reward} XP)")
        else:
            click.echo(f"\n+{card['xp']} XP | Level {card['level']} {card['title']} | Streak: {card['streak']}d")
            for ach in all_unlocked:
                click.echo(f"Achievement Unlocked: {ach.name} -- {ach.description} (+{ach.xp_reward} XP)")
    except Exception:
        pass  # Never break execution for gamification failures


# -- trainer (gamification commands) -------------------------------------------

@cli.command("trainer")
def trainer_card() -> None:
    """Show your trainer card -- level, XP, streak, collection progress."""
    from .gamification import GamificationEngine

    try:
        from rich.console import Console
        from rich.panel import Panel
        console = Console()
    except ImportError:
        console = None

    engine = GamificationEngine()
    card = engine.get_trainer_card()

    xp_bar_filled = int(card["xp_progress"] * 20)
    xp_bar = "#" * xp_bar_filled + "-" * (20 - xp_bar_filled)

    if console:
        lines = [
            f"[bold cyan]Level {card['level']}[/bold cyan] [bold]{card['title']}[/bold]",
            f"XP: {card['xp']:,} / {card['xp_next']:,}  [{xp_bar}]  {int(card['xp_progress'] * 100)}%",
            f"Streak: {card['streak']} days (best: {card['streak_best']}) x{card['streak_multiplier']}",
            "",
            f"Skills:       {card['skills_discovered']}/{card['skills_total']}",
            f"Chains:       {card['chains_completed']}/{card['chains_total']}",
            f"Achievements: {card['achievements_unlocked']}/{card['achievements_total']}",
            f"Total Runs:   {card['total_skill_runs']:,} skills, {card['total_chain_runs']:,} chains",
        ]
        console.print(Panel("\n".join(lines), title="[bold cyan]Trainer Card[/bold cyan]", border_style="cyan"))
    else:
        click.echo(f"Level {card['level']} {card['title']}")
        click.echo(f"XP: {card['xp']:,} / {card['xp_next']:,}  [{xp_bar}]  {int(card['xp_progress'] * 100)}%")
        click.echo(f"Streak: {card['streak']} days (best: {card['streak_best']})")
        click.echo(f"Skills: {card['skills_discovered']}/{card['skills_total']}")
        click.echo(f"Chains: {card['chains_completed']}/{card['chains_total']}")
        click.echo(f"Achievements: {card['achievements_unlocked']}/{card['achievements_total']}")


@cli.command("achievements")
def achievements_list() -> None:
    """List all achievements with lock/unlock status."""
    from .gamification import GamificationEngine

    try:
        from rich.console import Console
        from rich.table import Table
        console = Console()
    except ImportError:
        console = None

    engine = GamificationEngine()
    achievements = engine.get_achievements()
    unlocked = sum(1 for a in achievements if a["unlocked"])

    if console:
        table = Table(title=f"Achievements ({unlocked}/{len(achievements)})", show_lines=True)
        table.add_column("", width=4)
        table.add_column("Name", style="cyan")
        table.add_column("Description")
        table.add_column("XP", justify="right")
        table.add_column("Status")

        for a in achievements:
            if a["unlocked"]:
                status = f"[green]Unlocked[/green]"
                name = a["name"]
                icon = a["icon"]
            else:
                status = "[dim]Locked[/dim]"
                name = f"[dim]{a['name']}[/dim]"
                icon = f"[dim]{a['icon']}[/dim]"
            table.add_row(icon, name, a["description"], str(a["xp_reward"]), status)
        console.print(table)
    else:
        click.echo(f"Achievements ({unlocked}/{len(achievements)})")
        for a in achievements:
            status = "+" if a["unlocked"] else "-"
            click.echo(f"  {status} {a['name']:20s} {a['description']:40s} +{a['xp_reward']} XP")


@cli.command("skilldex")
def skilldex_view() -> None:
    """Show your skill collection progress by category."""
    from .gamification import GamificationEngine

    try:
        from rich.console import Console
        from rich.table import Table
        console = Console()
    except ImportError:
        console = None

    engine = GamificationEngine()
    dex = engine.get_skilldex()

    if console:
        console.print(f"\n[bold]Skilldex:[/bold] {dex['total_discovered']}/{dex['total_skills']} skills discovered ({dex['percent']}%)\n")

        table = Table(show_lines=True)
        table.add_column("Category", style="cyan")
        table.add_column("Progress", width=25)
        table.add_column("Count", justify="right")

        for cat, info in dex["categories"].items():
            filled = int(info["percent"] / 100 * 15)
            bar = "#" * filled + "-" * (15 - filled)
            pct = f"{info['percent']}%"
            table.add_row(cat, f"[{bar}] {pct}", f"{info['discovered']}/{info['total']}")
        console.print(table)

        # Show evolutions
        evos = engine.get_evolutions()
        if evos:
            console.print("\n[bold]Top Evolved Skills:[/bold]")
            for e in evos[:5]:
                console.print(f"  {e['tier']:10s} {e['skill']}")
    else:
        click.echo(f"Skilldex: {dex['total_discovered']}/{dex['total_skills']} ({dex['percent']}%)")
        for cat, info in dex["categories"].items():
            click.echo(f"  {cat:15s} {info['discovered']}/{info['total']}")


@cli.command("quests")
def quests_view() -> None:
    """Show today's daily quests."""
    from .gamification import GamificationEngine

    try:
        from rich.console import Console
        from rich.panel import Panel
        console = Console()
    except ImportError:
        console = None

    engine = GamificationEngine()
    quests = engine.get_daily_quests()

    if console:
        lines = []
        for q in quests:
            check = "[green][x][/green]" if q["completed"] else "[ ]"
            lines.append(f"  {check} {q['text']}  [dim]+{q['xp']} XP[/dim]")
        console.print(Panel("\n".join(lines), title="[bold]Daily Quests[/bold]", border_style="yellow"))
    else:
        click.echo("Daily Quests:")
        for q in quests:
            check = "[x]" if q["completed"] else "[ ]"
            click.echo(f"  {check} {q['text']}  +{q['xp']} XP")


# -- profile (command group) ---------------------------------------------------

@cli.group()
def profile() -> None:
    """Manage your SkillChain user profile."""


@profile.command("show")
@click.pass_context
def profile_show(ctx: click.Context) -> None:
    """Display current profile."""
    try:
        from rich.console import Console
        from rich.panel import Panel
        console = Console()
    except ImportError:
        console = None

    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    pm = ProfileManager(config_dir=config.config_dir)

    if not pm.exists():
        click.echo("No profile found. Run 'skillchain init' to create one.")
        return

    p = pm.load()

    lines = [
        f"Name:           {p.name or '-'}",
        f"Role:           {p.role or '-'}",
        f"Industry:       {p.industry or '-'}",
        f"Company:        {p.company_name or '-'} ({p.company_stage or '-'})",
        f"Team Size:      {p.team_size or '-'}",
        f"Tech Stack:     {', '.join(p.tech_stack) or '-'}",
        f"AI Platform:    {p.ai_platform or '-'}",
        f"Experience:     {p.experience_level or '-'}",
        f"Primary Goal:   {p.primary_goal or '-'}",
        f"Output Style:   {p.output_style or '-'}",
        f"Tone:           {p.communication_tone or '-'}",
        f"Member Since:   {p.member_since or '-'}",
    ]

    if console:
        console.print(Panel("\n".join(lines), title="SkillChain Profile", border_style="cyan"))
    else:
        click.echo("\n--- SkillChain Profile ---")
        for line in lines:
            click.echo(f"  {line}")
        click.echo("")


@profile.command("edit")
@click.pass_context
def profile_edit(ctx: click.Context) -> None:
    """Re-run profile onboarding."""
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    pm = ProfileManager(config_dir=config.config_dir)
    p = pm.onboard()
    p.ai_platform = config.agent_platform
    pm.save(p)

    adapter = get_adapter(config.agent_platform)
    _show_recommendations(pm, adapter)


@profile.command("recommend")
@click.pass_context
def profile_recommend(ctx: click.Context) -> None:
    """Show skill and chain recommendations based on profile."""
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    pm = ProfileManager(config_dir=config.config_dir)

    if not pm.exists():
        click.echo("No profile found. Run 'skillchain init' to create one.")
        return

    adapter = get_adapter(config.agent_platform)
    _show_recommendations(pm, adapter)


@profile.command("stats")
@click.pass_context
def profile_stats(ctx: click.Context) -> None:
    """Show usage statistics."""
    try:
        from rich.console import Console
        from rich.panel import Panel
        console = Console()
    except ImportError:
        console = None

    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    pm = ProfileManager(config_dir=config.config_dir)

    if not pm.exists():
        click.echo("No profile found. Run 'skillchain init' to create one.")
        return

    p = pm.load()

    # Count unique skills and most used
    from collections import Counter
    skill_counts = Counter(p.skills_used)
    top_skills = skill_counts.most_common(10)

    lines = [
        f"Total Runs:       {p.total_runs}",
        f"Unique Skills:    {len(skill_counts)}",
        f"Chains Run:       {len(p.chains_run)}",
        f"Favorite Domains: {', '.join(p.favorite_domains) or '-'}",
        "",
        "Top Skills:",
    ]
    if top_skills:
        for name, count in top_skills:
            lines.append(f"  {name:30s}  x{count}")
    else:
        lines.append("  (no skills used yet)")

    if console:
        console.print(Panel("\n".join(lines), title="Usage Statistics", border_style="cyan"))
    else:
        click.echo("\n--- Usage Statistics ---")
        for line in lines:
            click.echo(f"  {line}")
        click.echo("")


# -- Helpers -------------------------------------------------------------------

def _show_recommendations(pm: ProfileManager, adapter) -> None:
    """Display skill and chain recommendations."""
    try:
        from rich.console import Console
        console = Console()
    except ImportError:
        console = None

    # Check installed skills
    installed_skills = []
    skills_dir = adapter.default_skills_dir
    if skills_dir.exists():
        installed_skills = [p.stem for p in skills_dir.iterdir() if p.is_file()]

    recs = pm.suggest_skills(installed_skills=installed_skills)
    chains = pm.suggest_chains()

    if not recs and not chains:
        click.echo("No recommendations available for your profile.")
        return

    if console:
        console.print("\n[bold]Based on your profile, here are your recommended skills:[/bold]\n")
        for priority in ("essential", "recommended", "useful"):
            group = [r for r in recs if r.priority == priority]
            if group:
                console.print(f"[bold]{priority.upper()}:[/bold]")
                for r in group:
                    icon = "[green]\u2713[/green]" if r.installed else "[red]\u2717[/red]"
                    console.print(f"  {icon} {r.skill_name} — {r.reason}")
                console.print("")

        if chains:
            console.print("[bold]RECOMMENDED CHAINS:[/bold]")
            for c in chains:
                skills_str = " -> ".join(c.skills)
                console.print(f"  [cyan]->[/cyan] {c.chain_name}: {skills_str}")
            console.print("")

        console.print("[dim]Run 'skillchain profile recommend' to see this again.[/dim]\n")
    else:
        click.echo("\nBased on your profile, here are your recommended skills:\n")
        for priority in ("essential", "recommended", "useful"):
            group = [r for r in recs if r.priority == priority]
            if group:
                click.echo(f"{priority.upper()}:")
                for r in group:
                    icon = "+" if r.installed else "-"
                    click.echo(f"  {icon} {r.skill_name} — {r.reason}")
                click.echo("")

        if chains:
            click.echo("RECOMMENDED CHAINS:")
            for c in chains:
                skills_str = " -> ".join(c.skills)
                click.echo(f"  -> {c.chain_name}: {skills_str}")
            click.echo("")

        click.echo("Run 'skillchain profile recommend' to see this again.\n")


# -- social (command group) ----------------------------------------------------

@cli.group()
def social() -> None:
    """Agent social features: profiles, search, leaderboard, matches."""


@social.command("profile")
@click.argument("node_id", required=False, default=None)
@click.pass_context
def social_profile(ctx: click.Context, node_id: Optional[str]) -> None:
    """View an agent profile (yours if no node_id given)."""
    try:
        from rich.console import Console
        from rich.panel import Panel
        console = Console()
    except ImportError:
        console = None

    from .agent_social import SocialManager
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    sm = SocialManager(config)
    profile = sm.get_profile(node_id)

    tier_colors = {
        "legend": "bold magenta",
        "master": "bold yellow",
        "expert": "bold cyan",
        "contributor": "green",
        "newcomer": "dim",
    }
    tc = tier_colors.get(profile.reputation_tier, "dim")

    lines = [
        f"Node ID:             {profile.node_id}",
        f"Name:                {profile.display_name}",
        f"Bio:                 {profile.bio or '-'}",
        f"Domains:             {', '.join(profile.domains) or '-'}",
        f"Skills Published:    {profile.skills_published}",
        f"Skills Validated:    {profile.skills_validated}",
        f"Trust Score:         {profile.trust_score:.4f}",
        f"Reputation:          {profile.reputation_tier.upper()}",
        f"Total Earned:        {profile.total_earned:.2f} TRUST",
        f"Validation Accuracy: {profile.validation_accuracy:.0%}",
        f"Member Since:        {profile.member_since or '-'}",
        f"Last Active:         {profile.last_active or '-'}",
    ]

    if console:
        console.print(Panel("\n".join(lines), title=f"Agent Profile", border_style="cyan"))
    else:
        for line in lines:
            click.echo(f"  {line}")


@social.command("edit")
@click.option("--name", "display_name", default=None, help="Display name")
@click.option("--bio", default=None, help="Bio (280 chars max)")
@click.option("--domains", default=None, help="Comma-separated domain tags")
@click.pass_context
def social_edit(ctx: click.Context, display_name: Optional[str], bio: Optional[str],
                domains: Optional[str]) -> None:
    """Update your agent profile."""
    from .agent_social import SocialManager
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    sm = SocialManager(config)
    domain_list = [d.strip() for d in domains.split(",") if d.strip()] if domains else None
    profile = sm.update_profile(display_name=display_name, bio=bio, domains=domain_list)
    click.echo(f"Profile updated: {profile.display_name}")


@social.command("search")
@click.option("--domain", default=None, help="Filter by domain")
@click.option("--min-trust", default=0.0, type=float, help="Minimum trust score")
@click.pass_context
def social_search(ctx: click.Context, domain: Optional[str], min_trust: float) -> None:
    """Search for agents on the network."""
    try:
        from rich.console import Console
        from rich.table import Table
        console = Console()
    except ImportError:
        console = None

    from .agent_social import SocialManager
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    sm = SocialManager(config)
    agents = sm.search_agents(domain=domain, min_trust=min_trust)

    if not agents:
        click.echo("No agents found.")
        return

    if console:
        table = Table(title="Agent Search Results", show_lines=True)
        table.add_column("Node ID", style="cyan")
        table.add_column("Name", style="bold")
        table.add_column("Domains")
        table.add_column("Trust", justify="right")
        table.add_column("Tier")
        table.add_column("Skills", justify="right")

        for a in agents:
            table.add_row(
                a.node_id[:12] + "...",
                a.display_name,
                ", ".join(a.domains[:3]),
                f"{a.trust_score:.2f}",
                a.reputation_tier,
                str(a.skills_published),
            )
        console.print(table)
    else:
        for a in agents:
            click.echo(f"  {a.node_id[:12]}  {a.display_name}  trust={a.trust_score:.2f}  tier={a.reputation_tier}")


@social.command("leaderboard")
@click.option("--domain", default=None, help="Filter by domain")
@click.option("--limit", "-n", default=20, type=int, help="Number of results")
@click.pass_context
def social_leaderboard(ctx: click.Context, domain: Optional[str], limit: int) -> None:
    """Show top agents by trust score."""
    try:
        from rich.console import Console
        from rich.table import Table
        console = Console()
    except ImportError:
        console = None

    from .agent_social import SocialManager
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    sm = SocialManager(config)
    agents = sm.get_leaderboard(domain=domain, limit=limit)

    if not agents:
        click.echo("No agents found.")
        return

    if console:
        table = Table(title="Leaderboard", show_lines=True)
        table.add_column("#", justify="right")
        table.add_column("Name", style="bold")
        table.add_column("Trust", justify="right", style="green")
        table.add_column("Tier", style="cyan")
        table.add_column("Skills", justify="right")
        table.add_column("Earned", justify="right", style="yellow")

        for i, a in enumerate(agents, 1):
            table.add_row(
                str(i), a.display_name, f"{a.trust_score:.4f}",
                a.reputation_tier, str(a.skills_published),
                f"{a.total_earned:.1f}",
            )
        console.print(table)
    else:
        for i, a in enumerate(agents, 1):
            click.echo(f"  {i}. {a.display_name}  trust={a.trust_score:.4f}  tier={a.reputation_tier}")


@social.command("matches")
@click.pass_context
def social_matches(ctx: click.Context) -> None:
    """Find complementary agents for collaboration."""
    try:
        from rich.console import Console
        from rich.table import Table
        console = Console()
    except ImportError:
        console = None

    from .agent_social import SocialManager
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    sm = SocialManager(config)
    matches = sm.find_matches()

    if not matches:
        click.echo("No matches found. Add more agents to the network.")
        return

    if console:
        table = Table(title="Recommended Matches", show_lines=True)
        table.add_column("#", justify="right")
        table.add_column("Agent", style="bold")
        table.add_column("Score", justify="right", style="green")
        table.add_column("Reasons")

        for i, m in enumerate(matches[:10], 1):
            table.add_row(
                str(i), m.display_name, f"{m.match_score:.2f}",
                "; ".join(m.match_reasons[:2]) or "-",
            )
        console.print(table)
    else:
        for i, m in enumerate(matches[:10], 1):
            click.echo(f"  {i}. {m.display_name}  score={m.match_score:.2f}")


@social.command("teams")
@click.pass_context
def social_teams(ctx: click.Context) -> None:
    """Suggest multi-agent teams for collaboration."""
    try:
        from rich.console import Console
        from rich.panel import Panel
        console = Console()
    except ImportError:
        console = None

    from .agent_social import SocialManager
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    sm = SocialManager(config)
    teams = sm.suggest_teams()

    if not teams:
        click.echo("Not enough agents for team suggestions.")
        return

    if console:
        for t in teams:
            members = ", ".join(m.display_name for m in t.members)
            lines = [
                f"Members:  {members}",
                f"Score:    {t.team_score:.2f}",
                f"Skills:   {', '.join(t.combined_skills[:6])}",
                f"Chains:   {', '.join(t.achievable_chains) or '-'}",
            ]
            console.print(Panel("\n".join(lines), title=t.team_name, border_style="cyan"))
    else:
        for t in teams:
            members = ", ".join(m.display_name for m in t.members)
            click.echo(f"  {t.team_name}: {members} (score={t.team_score:.2f})")


# -- inbox (command group) ----------------------------------------------------

@cli.group()
def inbox() -> None:
    """Manage agent-to-agent messages."""


@inbox.command("list")
@click.option("--all", "show_all", is_flag=True, help="Show all messages (not just unread)")
@click.pass_context
def inbox_list(ctx: click.Context, show_all: bool) -> None:
    """Show inbox messages (unread by default)."""
    try:
        from rich.console import Console
        from rich.table import Table
        console = Console()
    except ImportError:
        console = None

    from .agent_social import SocialManager
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    sm = SocialManager(config)
    messages = sm.get_inbox(unread_only=not show_all)

    if not messages:
        click.echo("No messages." if show_all else "No unread messages.")
        return

    if console:
        table = Table(title="Inbox", show_lines=True)
        table.add_column("ID", style="dim")
        table.add_column("From", style="cyan")
        table.add_column("Type")
        table.add_column("Subject", style="bold")
        table.add_column("Time", style="dim")
        table.add_column("Read")

        for m in messages:
            table.add_row(
                m.msg_id[:8], m.from_node[:12],
                m.msg_type, m.subject,
                m.timestamp[:19] if m.timestamp else "-",
                "yes" if m.read else "[bold red]NO[/bold red]",
            )
        console.print(table)
    else:
        for m in messages:
            flag = " " if m.read else "*"
            click.echo(f"  {flag} [{m.msg_id[:8]}] from={m.from_node[:12]}  {m.subject}")


@inbox.command("send")
@click.argument("node_id")
@click.argument("subject")
@click.option("--body", "-b", default=None, help="Message body (or reads from stdin)")
@click.pass_context
def inbox_send(ctx: click.Context, node_id: str, subject: str, body: Optional[str]) -> None:
    """Send a direct message to an agent."""
    from .agent_social import SocialManager

    if body is None:
        body = click.get_text_stream("stdin").read().strip()
        if not body:
            body = click.prompt("Message body")

    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    sm = SocialManager(config)
    msg = sm.send_message(to_node=node_id, msg_type="direct", subject=subject, body=body)
    click.echo(f"Sent message {msg.msg_id[:8]} to {node_id}")


@inbox.command("read")
@click.argument("msg_id")
@click.pass_context
def inbox_read(ctx: click.Context, msg_id: str) -> None:
    """Read a message and mark it as read."""
    try:
        from rich.console import Console
        from rich.panel import Panel
        console = Console()
    except ImportError:
        console = None

    from .agent_social import SocialManager
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    sm = SocialManager(config)

    # Find the message by prefix match
    messages = sm.get_inbox()
    msg = None
    for m in messages:
        if m.msg_id.startswith(msg_id):
            msg = m
            break

    if not msg:
        click.echo(f"Message {msg_id} not found.")
        return

    sm.mark_read(msg.msg_id)

    lines = [
        f"From:    {msg.from_node}",
        f"Type:    {msg.msg_type}",
        f"Time:    {msg.timestamp}",
        f"",
        msg.body,
    ]

    if console:
        console.print(Panel("\n".join(lines), title=msg.subject, border_style="cyan"))
    else:
        click.echo(f"Subject: {msg.subject}")
        for line in lines:
            click.echo(f"  {line}")


@inbox.command("reply")
@click.argument("msg_id")
@click.option("--body", "-b", default=None, help="Reply body")
@click.pass_context
def inbox_reply(ctx: click.Context, msg_id: str, body: Optional[str]) -> None:
    """Reply to a message."""
    from .agent_social import SocialManager

    if body is None:
        body = click.prompt("Reply body")

    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    sm = SocialManager(config)

    # Find by prefix
    messages = sm.get_inbox()
    full_id = msg_id
    for m in messages:
        if m.msg_id.startswith(msg_id):
            full_id = m.msg_id
            break

    reply_msg = sm.reply(full_id, body)
    click.echo(f"Reply sent: {reply_msg.msg_id[:8]}")


# -- bounty (command group) ---------------------------------------------------

@cli.group()
def bounty() -> None:
    """Browse and manage skill bounties."""


@bounty.command("list")
@click.option("--domain", default=None, help="Filter by domain")
@click.option("--min-reward", default=0.0, type=float, help="Minimum reward in TRUST")
@click.option("--status", default="open", help="Bounty status filter")
@click.pass_context
def bounty_list(ctx: click.Context, domain: Optional[str], min_reward: float,
                status: str) -> None:
    """List bounties on the network."""
    try:
        from rich.console import Console
        from rich.table import Table
        console = Console()
    except ImportError:
        console = None

    from .agent_social import SocialManager
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    sm = SocialManager(config)
    bounties = sm.list_bounties(domain=domain, status=status)

    if min_reward > 0:
        bounties = [b for b in bounties if b.reward_trust >= min_reward]

    if not bounties:
        click.echo("No bounties found.")
        return

    if console:
        table = Table(title="Skill Bounties", show_lines=True)
        table.add_column("ID", style="dim")
        table.add_column("Title", style="bold")
        table.add_column("Domain")
        table.add_column("Reward", justify="right", style="yellow")
        table.add_column("Deadline", style="dim")
        table.add_column("Status")

        for b in bounties:
            table.add_row(
                b.bounty_id[:8], b.title, b.domain,
                f"{b.reward_trust:.0f} TRUST", b.deadline[:10] if b.deadline else "-",
                b.status.upper(),
            )
        console.print(table)
    else:
        for b in bounties:
            click.echo(f"  [{b.bounty_id[:8]}] {b.title}  {b.reward_trust} TRUST  ({b.status})")


@bounty.command("create")
@click.option("--title", required=True, help="Bounty title")
@click.option("--description", "-d", default="", help="Detailed description")
@click.option("--domain", required=True, help="Domain tag")
@click.option("--reward", required=True, type=float, help="Reward in TRUST")
@click.option("--deadline", required=True, help="Deadline (ISO date, e.g. 2026-04-15)")
@click.pass_context
def bounty_create(ctx: click.Context, title: str, description: str,
                  domain: str, reward: float, deadline: str) -> None:
    """Post a new skill bounty."""
    from .agent_social import SocialManager
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    sm = SocialManager(config)
    b = sm.create_bounty(title=title, description=description, domain=domain,
                         reward=reward, deadline=deadline)
    click.echo(f"Bounty created: {b.bounty_id[:8]} - {b.title} ({b.reward_trust} TRUST)")


@bounty.command("claim")
@click.argument("bounty_id")
@click.pass_context
def bounty_claim(ctx: click.Context, bounty_id: str) -> None:
    """Claim an open bounty."""
    from .agent_social import SocialManager
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    sm = SocialManager(config)
    try:
        b = sm.claim_bounty(bounty_id)
        click.echo(f"Claimed bounty: {b.title}")
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@bounty.command("submit")
@click.argument("bounty_id")
@click.argument("skill_id")
@click.pass_context
def bounty_submit(ctx: click.Context, bounty_id: str, skill_id: str) -> None:
    """Submit a skill to fulfill a bounty."""
    from .agent_social import SocialManager
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    sm = SocialManager(config)
    try:
        b = sm.submit_bounty(bounty_id, skill_id)
        click.echo(f"Submitted skill {skill_id} for bounty: {b.title}")
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@bounty.command("complete")
@click.argument("bounty_id")
@click.pass_context
def bounty_complete(ctx: click.Context, bounty_id: str) -> None:
    """Approve a bounty submission and release payment."""
    from .agent_social import SocialManager
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    sm = SocialManager(config)
    try:
        b = sm.complete_bounty(bounty_id)
        click.echo(f"Bounty completed: {b.title} ({b.reward_trust} TRUST paid)")
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


# -- collab (command group) ---------------------------------------------------

@cli.group()
def collab() -> None:
    """Manage collaborative chain executions."""


@collab.command("propose")
@click.argument("chain_file", type=click.Path(exists=True))
@click.option("--with", "partner_node", required=True, help="Partner node ID")
@click.option("--assign", required=True, help='Step assignments, e.g. "steps 1-3: me, steps 4-5: them"')
@click.pass_context
def collab_propose(ctx: click.Context, chain_file: str, partner_node: str,
                   assign: str) -> None:
    """Propose a collaborative chain execution."""
    from .agent_social import SocialManager
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    sm = SocialManager(config)

    # Parse assignment string
    assignments: dict[str, list[str]] = {}
    for part in assign.split(","):
        part = part.strip()
        if ":" not in part:
            continue
        steps_str, who = part.rsplit(":", 1)
        who = who.strip()
        steps = [s.strip() for s in steps_str.split()]
        node = sm._node_id if who.lower() == "me" else partner_node
        assignments.setdefault(node, []).extend(steps)

    chain_def = json.loads(Path(chain_file).read_text(encoding="utf-8"))

    c = sm.propose_collaboration(
        chain_name=Path(chain_file).stem,
        chain_def=chain_def,
        participant_assignments=assignments,
    )
    click.echo(f"Collaboration proposed: {c.collab_id[:8]}")


@collab.command("accept")
@click.argument("collab_id")
@click.pass_context
def collab_accept(ctx: click.Context, collab_id: str) -> None:
    """Accept a collaboration invitation."""
    from .agent_social import SocialManager
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    sm = SocialManager(config)
    try:
        c = sm.accept_collaboration(collab_id)
        click.echo(f"Accepted collaboration: {c.chain_name}")
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@collab.command("status")
@click.argument("collab_id")
@click.pass_context
def collab_status(ctx: click.Context, collab_id: str) -> None:
    """Check collaboration status."""
    try:
        from rich.console import Console
        from rich.panel import Panel
        console = Console()
    except ImportError:
        console = None

    from .agent_social import SocialManager
    config = SkillChainConfig.load(network=ctx.obj.get("network"))
    sm = SocialManager(config)
    try:
        c = sm.get_collaboration(collab_id)
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)

    lines = [
        f"Chain:        {c.chain_name}",
        f"Status:       {c.status.upper()}",
        f"Initiator:    {c.initiator_node}",
        f"Participants: {len(c.participants)}",
    ]
    for node_id, steps in c.participants.items():
        lines.append(f"  {node_id[:12]}: {', '.join(steps)}")

    if console:
        console.print(Panel("\n".join(lines), title=f"Collaboration {collab_id[:8]}", border_style="cyan"))
    else:
        for line in lines:
            click.echo(f"  {line}")


# -- mcp (command group) -------------------------------------------------------

@cli.group()
def mcp() -> None:
    """MCP server management."""


@mcp.command("serve")
@click.option("--port", default=3179, type=int, help="Server port (default: 3179)")
def mcp_serve(port: int) -> None:
    """Start the SkillChain MCP server (stdio transport)."""
    from .mcp_bridge.server import create_server

    server = create_server()
    click.echo(f"Starting SkillChain MCP server v{server.name}...")
    server.run(transport="stdio")


@mcp.command("install")
def mcp_install() -> None:
    """Add SkillChain MCP server to Claude Code settings."""
    from .mcp_bridge.claude_settings import install_mcp_server

    path = install_mcp_server()
    click.echo(f"SkillChain MCP server installed in {path}")
    click.echo("Restart Claude Code to connect.")


@mcp.command("uninstall")
def mcp_uninstall() -> None:
    """Remove SkillChain MCP server from Claude Code settings."""
    from .mcp_bridge.claude_settings import uninstall_mcp_server

    removed = uninstall_mcp_server()
    if removed:
        click.echo("SkillChain MCP server removed from Claude Code settings.")
    else:
        click.echo("SkillChain MCP server was not configured.")


@mcp.command("status")
def mcp_status() -> None:
    """Check if SkillChain MCP server is configured in Claude Code."""
    from .mcp_bridge.claude_settings import is_installed

    if is_installed():
        click.echo("SkillChain MCP server is configured in Claude Code settings.")
    else:
        click.echo("SkillChain MCP server is NOT configured. Run 'skillchain mcp install'.")


# -- debug (the killer feature) ------------------------------------------------

@cli.command("debug")
@click.argument("repo_path", type=click.Path(exists=True))
@click.option("--error", "-e", default=None, help="Error message or traceback to parse directly")
@click.option("--mode", type=click.Choice(["verified-fix", "auto-fix", "explain", "diagnose"]),
              default="verified-fix", help="Operation mode (default: verified-fix)")
@click.option("--max-attempts", default=3, type=int, help="Max fix attempts (auto-fix mode)")
@click.option("--candidates", default=5, type=int, help="Number of fix candidates (verified-fix mode)")
def debug(repo_path: str, error: str | None, mode: str, max_attempts: int, candidates: int) -> None:
    """Debug and fix a codebase. Drop your repo, get working code back.

    Default mode generates 5 fix candidates, tests all in parallel sandboxes,
    and returns the best verified fix (tournament selection).
    """
    try:
        from rich.console import Console
        from rich.syntax import Syntax
        console = Console()
    except ImportError:
        console = None

    # Map CLI mode name to engine mode name
    engine_mode = "diagnose-only" if mode == "diagnose" else mode

    try:
        from skillchain.tools.debugger import DebugEngine

        engine = DebugEngine()

        if console:
            console.print(f"\n[bold cyan]SkillChain Debugger[/bold cyan]")
            console.print(f"  Repo:       {repo_path}")
            console.print(f"  Mode:       {engine_mode}")
            if engine_mode == "verified-fix":
                console.print(f"  Candidates: {candidates}")
            if error:
                console.print(f"  Error:      {error[:80]}{'...' if len(error or '') > 80 else ''}")
            console.print()

        result = engine.run(
            repo_path=repo_path,
            error_text=error,
            mode=engine_mode,
            max_attempts=max_attempts,
            candidate_count=candidates,
        )

        # -- Output results --------------------------------------------------------

        if console:
            # Codebase info
            if result.codebase:
                cb = result.codebase
                console.print(f"[dim]Language:[/dim]    {cb.language}")
                console.print(f"[dim]Framework:[/dim]  {cb.framework or 'none'}")
                console.print(f"[dim]Test cmd:[/dim]   {cb.test_command or 'none'}")
                console.print()

            # Errors found
            if result.errors_found:
                console.print(f"[bold yellow]Errors found: {len(result.errors_found)}[/bold yellow]")
                for err in result.errors_found:
                    console.print(f"  [red]{err.error_type}[/red]: {err.message}")
                    if err.file_path:
                        console.print(f"    at {err.location}")
                console.print()

            # Analyses
            if result.analyses:
                console.print("[bold]Root cause analysis:[/bold]")
                for analysis in result.analyses:
                    conf_color = "green" if analysis.confidence >= 0.8 else "yellow" if analysis.confidence >= 0.5 else "red"
                    console.print(f"  [{conf_color}]{analysis.confidence:.0%}[/{conf_color}] {analysis.primary_cause}")
                    for hint in analysis.fix_hints:
                        console.print(f"      [dim]{hint}[/dim]")
                console.print()

            # Tournament results (verified-fix mode)
            if result.tournament and result.tournament.all_candidates:
                console.print("[bold]Tournament Results:[/bold]")
                for cr in result.tournament.all_candidates:
                    marker = "[bold green]>[/bold green]" if cr.rank == 1 else " "
                    check = " [green]pass[/green]" if cr.test_results.all_passing else ""
                    console.print(
                        f"  {marker} #{cr.rank} {cr.fix.description[:40]:<40} "
                        f"Score: {cr.score:.2f}  "
                        f"Tests: {cr.test_results.passed}/{cr.test_results.total}{check}  "
                        f"Lines: +{cr.lines_changed}"
                    )
                console.print()

                if result.tournament.winner:
                    w = result.tournament.winner
                    consensus_pct = f"{result.tournament.consensus:.0%}"
                    console.print(
                        f"[bold green]Winner:[/bold green] {w.fix.description} "
                        f"(Score: {w.score:.2f}, Best of {result.tournament.total_candidates})"
                    )
                    console.print(f"[bold]Consensus:[/bold] {consensus_pct}")
                    console.print(
                        f"[bold]VERIFIED[/bold] across {result.tournament.tested_candidates} independent runs"
                    )
                    console.print()

            # Fixes applied
            if result.fixes_applied:
                console.print(f"[bold green]Fixes applied: {len(result.fixes_applied)}[/bold green]")
                for fix in result.fixes_applied:
                    console.print(f"  {fix.description} (confidence: {fix.confidence:.0%})")
                console.print()

                # Show diffs
                if result.report and result.report.diffs:
                    console.print("[bold]Diffs:[/bold]")
                    for diff in result.report.diffs:
                        console.print(Syntax(diff, "diff", theme="monokai"))
                    console.print()

            # Before/After table
            if result.report and result.report.comparison_table:
                console.print("[bold]Results:[/bold]")
                console.print(result.report.comparison_table)
                console.print()

            # Summary
            if result.report and result.report.summary:
                console.print(result.report.summary)
                console.print()

            # Explanation (explain / diagnose modes)
            if result.explanation and engine_mode in ("explain", "diagnose-only"):
                console.print(result.explanation)

            # Final status
            if result.success:
                console.print(f"[bold green]SUCCESS[/bold green] in {result.duration_ms:.0f}ms")
            else:
                console.print(f"[bold red]INCOMPLETE[/bold red] in {result.duration_ms:.0f}ms")
        else:
            # Fallback: plain text output
            if result.report:
                click.echo(result.report.comparison_table)
                click.echo()
                click.echo(result.report.summary)
            if result.explanation:
                click.echo(result.explanation)
            status = "SUCCESS" if result.success else "INCOMPLETE"
            click.echo(f"\n{status} in {result.duration_ms:.0f}ms")

    except Exception as exc:
        click.echo(f"Error: {exc}", err=True)
        sys.exit(1)


# -- launch (Solopreneur Engine) -----------------------------------------------

@cli.command("launch")
@click.argument("idea")
@click.option("--audience", "-a", default=None, help="Target audience")
@click.option("--skills", "-s", default=None, help="Your skills (comma separated)")
@click.option("--budget", "-b", default=None, help="Monthly budget (e.g. '$500/month')")
@click.option("--type", "biz_type", default=None,
              type=click.Choice(["saas", "service", "ecommerce", "marketplace",
                                 "content", "agency", "consulting"]),
              help="Business type")
@click.option("--validate-only", is_flag=True, help="Quick validation only, no full plan")
@click.option("--outreach-only", is_flag=True, help="Just generate outreach content")
@click.option("--output", "-o", default=None, type=click.Path(), help="Save full report to file")
def launch(idea: str, audience: str | None, skills: str | None, budget: str | None,
           biz_type: str | None, validate_only: bool, outreach_only: bool,
           output: str | None) -> None:
    """Launch a business. Tell me your idea, get a running plan back.

    Example::

        skillchain launch "AI invoice processing for freelancers" \\
            --audience "freelancers doing $50K-200K/year" \\
            --skills "python,ML,freelancing" \\
            --budget "$500/month"
    """
    from skillchain.tools.solopreneur import SolopreneurEngine

    engine = SolopreneurEngine()
    skill_list = [s.strip() for s in skills.split(",")] if skills else None

    if validate_only:
        result = engine.validate_only(
            idea=idea,
            target_audience=audience or "",
            founder_skills=skill_list,
        )
        click.echo(f"\nValidation Score: {result.overall_score}/50")
        click.echo(f"Recommendation:  {result.recommendation.upper()}")
        for dim, score in result.scores.items():
            label = dim.replace("_", " ").title()
            click.echo(f"  {label:24s} {score}/10")
        if result.strengths:
            click.echo("\nStrengths:")
            for s in result.strengths:
                click.echo(f"  + {s}")
        if result.concerns:
            click.echo("\nConcerns:")
            for c in result.concerns:
                click.echo(f"  ! {c}")
        return

    if outreach_only:
        pack = engine.outreach_only(
            idea=idea,
            target_audience=audience or "",
            business_type=biz_type,
            budget=budget,
        )
        click.echo(f"\nGenerated {len(pack.cold_emails)} email variants, "
                    f"{len(pack.linkedin_sequences)} LinkedIn sequences, "
                    f"{len(pack.social_posts)} social posts.")
        click.echo(f"\nElevator pitch:\n{pack.elevator_pitch}")
        return

    # Full pipeline
    result = engine.run(
        idea=idea,
        target_audience=audience or "",
        founder_skills=skill_list,
        budget=budget,
        business_type=biz_type,
    )

    if result.success:
        click.echo(result.report)
        if output:
            Path(output).write_text(result.full_report, encoding="utf-8")
            click.echo(f"\nFull report saved to: {output}")
    else:
        click.echo(f"Launch pipeline failed: {result.error}", err=True)
        sys.exit(1)


# -- claim (onboarding rewards) ------------------------------------------------

@cli.command("claim")
@click.argument("bonus_type", type=click.Choice([
    "starter", "first-skill", "first-validation", "first-purchase", "referral",
]))
@click.option("--referrer", default=None, help="Referrer node ID (for referral bonus)")
@click.pass_context
def claim(ctx: click.Context, bonus_type: str, referrer: str | None) -> None:
    """Claim onboarding bonuses."""
    try:
        from rich.console import Console
        console = Console()
    except ImportError:
        console = None

    try:
        node = _get_node(ctx.obj.get("network"))

        method_map = {
            "starter": "claimStarter",
            "first-skill": "claimFirstSkillBonus",
            "first-validation": "claimFirstValidationBonus",
            "first-purchase": "claimFirstPurchaseBonus",
            "referral": "claimReferralBonus",
        }

        method = method_map[bonus_type]

        if bonus_type == "referral":
            if not referrer:
                click.echo("Error: --referrer is required for referral bonus", err=True)
                sys.exit(1)
            tx = node.call_onboarding(method, referrer)
        else:
            tx = node.call_onboarding(method)

        if console:
            console.print(f"[bold green]Bonus claimed![/bold green] {bonus_type}")
            console.print(f"  Tx: [dim]{tx}[/dim]")
        else:
            click.echo(f"Bonus claimed: {bonus_type}")
            click.echo(f"  Tx: {tx}")

    except SkillChainError as exc:
        click.echo(f"Error: {exc}", err=True)
        sys.exit(1)


# -- Helpers -------------------------------------------------------------------

def _install_skill_template() -> None:
    """Install the skillchain skill template to ~/.claude/skills/."""
    template_dir = Path(__file__).parent / "templates"
    skill_template = template_dir / "skillchain_skill.md"

    if not skill_template.exists():
        return

    target_dir = Path.home() / ".claude" / "skills"
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / "skillchain.md"

    if not target.exists():
        target.write_text(skill_template.read_text(encoding="utf-8"), encoding="utf-8")
        logger.info("Installed skillchain skill template to %s", target)


# -- model (GovernanceNet) -----------------------------------------------------

@cli.group()
def model():
    """GovernanceNet model management."""
    pass


@model.command("train")
@click.option("--samples", default=10000, help="Number of synthetic training samples")
@click.option("--epochs", default=100, help="Training epochs")
@click.option("--lr", default=0.001, type=float, help="Learning rate")
@click.option("--batch-size", default=32, help="Batch size")
@click.option("--output", default=None, help="Output path for trained weights (JSON)")
@click.option("--output-bin", default=None, help="Also save VELMAGNV binary weights")
@click.option("--seed", default=42, help="Random seed")
def model_train(samples, epochs, lr, batch_size, output, output_bin, seed):
    """Train GovernanceNet on synthetic network data."""
    import logging
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    from skillchain.core.governance_net.config import TrainingConfig
    from skillchain.core.governance_net.synthetic_data import SyntheticDataGenerator
    from skillchain.core.governance_net.trainer import GovernanceNetTrainer
    from skillchain.core.governance_net.evaluator import GovernanceNetEvaluator
    import numpy as np

    config = TrainingConfig(
        synthetic_samples=samples,
        seed=seed,
        learning_rate=lr,
        epochs=epochs,
        batch_size=batch_size,
    )

    # Default output path
    if output is None:
        model_dir = Path.home() / ".skillchain" / "model"
        model_dir.mkdir(parents=True, exist_ok=True)
        output = str(model_dir / "governance_net.json")

    click.echo(f"Generating {samples:,} synthetic samples...")
    gen = SyntheticDataGenerator(config)
    features, labels = gen.generate()

    # Train/test split
    split = int(len(features) * config.train_split)
    train_f, test_f = features[:split], features[split:]
    train_l, test_l = labels[:split], labels[split:]

    click.echo(f"Training GovernanceNet (11->128->128->3)...")
    click.echo(f"  {split:,} train / {len(features) - split:,} test samples")
    click.echo()

    trainer = GovernanceNetTrainer(
        learning_rate=lr,
        epochs=epochs,
        batch_size=batch_size,
        config=config,
    )
    result = trainer.train(train_f, train_l, verbose=True)

    # Evaluate on test set
    evaluator = GovernanceNetEvaluator()

    def forward_fn(x):
        outputs, _ = trainer._forward(x.astype(np.float32), result.weights)
        return outputs

    eval_result = evaluator.evaluate(forward_fn, test_f, test_l)

    click.echo()
    click.echo(f"Training complete ({result.epochs_run} epochs)")
    click.echo(f"  Final loss:        {result.final_loss:.4f}")
    click.echo(f"  Trust MSE:         {eval_result.trust_mse:.4f}")
    click.echo(f"  Degraded accuracy: {eval_result.degraded_accuracy * 100:.1f}%")
    click.echo(f"  Unsafe accuracy:   {eval_result.unsafe_accuracy * 100:.1f}%")
    click.echo(f"  False positive (good->unsafe): {eval_result.false_positive_rate * 100:.1f}%")
    click.echo(f"  False negative (malicious->safe): {eval_result.false_negative_rate * 100:.1f}%")

    # Save weights
    output_path = Path(output).expanduser()
    trainer.save_weights_json(output_path, result.weights)
    click.echo(f"\nModel saved to {output_path}")

    if output_bin:
        bin_path = Path(output_bin).expanduser()
        trainer.save_weights(bin_path, result.weights)
        click.echo(f"VELMAGNV binary saved to {bin_path}")

    click.echo("Compatible with VELMAGNV format")


@model.command("evaluate")
@click.option("--model-path", default=None, help="Path to trained weights (JSON)")
@click.option("--samples", default=2000, help="Number of test samples")
@click.option("--seed", default=99, help="Random seed for test data")
def model_evaluate(model_path, samples, seed):
    """Evaluate trained model accuracy on fresh synthetic data."""
    import logging
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    from skillchain.core.governance_net.config import TrainingConfig
    from skillchain.core.governance_net.synthetic_data import SyntheticDataGenerator
    from skillchain.core.governance_net.inference import SkillChainGovernanceNet
    from skillchain.core.governance_net.evaluator import GovernanceNetEvaluator
    import numpy as np

    if model_path is None:
        model_path = str(Path.home() / ".skillchain" / "model" / "governance_net.json")

    model_path = Path(model_path).expanduser()
    if not model_path.exists():
        click.echo(f"Model not found: {model_path}")
        click.echo("Run 'skillchain model train' first.")
        sys.exit(1)

    click.echo(f"Loading model from {model_path}")
    net = SkillChainGovernanceNet(model_path)

    click.echo(f"Generating {samples:,} fresh test samples (seed={seed})...")
    config = TrainingConfig(seed=seed)
    gen = SyntheticDataGenerator(config)
    test_features, test_labels = gen.generate(samples)

    evaluator = GovernanceNetEvaluator()

    def forward_fn(x):
        return net._forward(x)

    eval_result = evaluator.evaluate(forward_fn, test_features, test_labels)

    click.echo()
    click.echo("Evaluation Results:")
    click.echo(f"  Trust MSE:         {eval_result.trust_mse:.4f}")
    click.echo(f"  Degraded accuracy: {eval_result.degraded_accuracy * 100:.1f}%")
    click.echo(f"  Unsafe accuracy:   {eval_result.unsafe_accuracy * 100:.1f}%")
    click.echo(f"  False positive (good->unsafe): {eval_result.false_positive_rate * 100:.1f}%")
    click.echo(f"  False negative (malicious->safe): {eval_result.false_negative_rate * 100:.1f}%")
    click.echo()
    click.echo("Confusion matrix (unsafe):")
    cm = eval_result.unsafe_confusion
    click.echo(f"  TN={cm[0][0]:5d}  FP={cm[0][1]:5d}")
    click.echo(f"  FN={cm[1][0]:5d}  TP={cm[1][1]:5d}")


# -- Entry point ---------------------------------------------------------------

def main() -> None:
    """CLI entry point."""
    cli(obj={})


if __name__ == "__main__":
    main()
